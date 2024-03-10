import { NextMenu, Session, Type, ValidationResponse } from "@src/types";
import { Request, Response } from "@src/types/request";
import { State, StateMode } from "@src/models/ussd-state";
import { MenuRouter, DynamicMenu, Menu, Menus } from "@src/menus";
import { Config, ConfigOptions } from "@src/config";
import { BaseMenu, MenuAction } from "@src/menus";
import { menuType, validateInput } from "@src/helpers";
import { FormMenuHandler } from "./form_handler";

export class RequestHandler {
  constructor(
    private request: Request,
    private response: Response,
    private router: Menus,
  ) { }

  private async setCurrentMenu(id: string, state: State) {
    state.menu ??= {
      nextMenu: undefined,
      visited: {},
    };
    state.menu.nextMenu = id;
    await this.session.setState(state.sessionId, state);
  }

  private get config(): Config {
    return Config.getInstance();
  }

  private get session() {
    return this.config.session!;
  }

  private async isFormMenu(menu: Menu) {
    if (menuType(menu) == "class") {
      return (await (menu as unknown as BaseMenu).isForm()) || false;
    } else {
      return (await (menu as DynamicMenu).isFormMenu) || false;
    }
  }

  private async formHandler(currentMenu: Menu, state: State) {
    const formHandler = new FormMenuHandler(
      this.request,
      this.response,
      currentMenu,
    );
    const nextMenu = await formHandler.handle();

    if (!state.isEnd) {
      await this.session.setState(state.sessionId, state);
    }

    if (nextMenu != null) {
      currentMenu = (await this.navigateToNextMenu(state, nextMenu)).menu!;
      this.response.data = await this.buildResponse(currentMenu, state);

      await this.resolveGateway("response");
      return this.response;
    }

    await this.resolveGateway("response");
    return this.response;
  }

  async processRequest() {
    this.router = MenuRouter;

    let currentMenu: Menu | undefined = undefined;

    // Resolve middlewares
    const state = (await this.resolveGateway("request"))!;

    // Initialize state menu object
    state.menu ??= {
      nextMenu: undefined,
      visited: {},
    };
    this.request.state = state;
    this.request.session = this.getSession();

    // Each menu is visited at least twice,
    // (1) to get the menu options and display message to the, and
    // (2) then get the user input and validate it
    // (3) repeat (1) and (2) until the user input is valid or session is terminated
    //

    // If next menu is null, it means the menu is yet to be visited. Get options and display message
    // else, validate user input and add the menu to the visited list
    if (state.menu?.nextMenu == null) {
      currentMenu = await this.lookupMenu(state);
      this.response.data = await this.buildResponse(currentMenu, state);

      await this.resolveGateway("response");
      return this.response;
    } else {
      currentMenu = await this.lookupMenu(state);
    }

    // If current menu is a form, use form handler
    if (await this.isFormMenu(currentMenu)) {
      return this.formHandler(currentMenu, state);
    }

    // Resolve menu options
    await this.lookupMenuOptions(state, currentMenu);

    const error = await this.validateUserData(state, currentMenu);

    if (error != null) {
      this.response.data = error;
      await this.resolveGateway("response");

      return this.response;
    }

    currentMenu = await this.resolveNextMenu(state, currentMenu);

    if (currentMenu != null) {
      // Next menu is a form, use form handler to build response
      if (await this.isFormMenu(currentMenu)) {
        return this.formHandler(currentMenu, state);
      }

      // If menu terminates the session, end the session
      let isEnd = false;
      if (menuType(currentMenu) == "class") {
        isEnd = await (currentMenu as unknown as BaseMenu).end();
      } else {
        isEnd = (currentMenu as DynamicMenu).isEnd;
      }

      if (isEnd) {
        state.end();
      }
    }

    this.response.data = await this.buildResponse(currentMenu, state);

    await this.resolveGateway("response");
    return this.response;
  }

  private async validateUserData(
    state: State,
    menu: Menu,
    error?: string,
  ): Promise<string | undefined> {
    let result = await validateInput({
      state: state,
      menu: menu,
      request: this.request,
      response: this.response,
    });

    // If input is invalid, stop processing and return the error message
    if (!result.valid) {
      error = result.error || (await this.buildResponse(menu, state));
      return error;
    }

    return error;
  }

  private async buildResponse(
    menu: Menu | undefined,
    state: State,
    errorMessage?: string,
  ) {
    if (errorMessage != null) {
      return errorMessage;
    }

    // No message to display, end session
    if (menu == null && state.isEnd) {
      return "";
    }

    let message = "";
    if (menuType(menu!) == "class") {
      message = await (menu as unknown as BaseMenu).message();
    } else {
      message = await (menu as DynamicMenu).getMessage(
        this.request,
        this.response,
      );
    }

    // Add options to the message
    if (menuType(menu!) == "class") {
      const _actions = (await (menu as unknown as BaseMenu).actions()) || [];
      for await (const action of _actions) {
        if (action.display == null) continue;

        if (typeof action.display == "function") {
          message += "\n" + (await action.display(this.request, this.response));
        } else {
          message += "\n" + action.display || "";
        }
      }
      return message;
    }

    for await (const action of await (menu as DynamicMenu).getActions()) {
      if (action.display == null) continue;

      if (typeof action.display == "function") {
        message += "\n" + (await action.display(this.request, this.response));
      } else {
        message += "\n" + action.display || "";
      }
    }
    return message;
  }

  private async resolveNextMenu(state: State, currentMenu: Menu) {
    const action = state.action;

    // Execute the action handler
    if (action?.handler != null) {
      await action.handler(this.request);
    }

    // Resolve next menu and make it the current menu
    const resp = await this.navigateToNextMenu(state, action?.next_menu);
    if (resp.status) {
      return resp.menu!;
    }

    // Action doesn't have next menu defined, fallback to default next menu
    if (menuType(currentMenu) == "class") {
      const _next = await (currentMenu as unknown as BaseMenu).nextMenu();

      // No next menu, end session
      if (_next == null) {
        await this.endSession(state);
        return undefined;
      }

      return (await this.navigateToNextMenu(state, _next)).menu;
    }

    const _next = await (currentMenu as DynamicMenu).getDefaultNextMenu(
      this.request,
      this.response,
    );

    if (_next != null) {
      return (await this.navigateToNextMenu(state, _next)).menu;
    }

    await this.endSession(state);
    return undefined;
  }

  /**
   * Resolve next menu and make it the current menu.
   */
  private async navigateToNextMenu(state: State, next_menu?: NextMenu) {
    let status = false,
      menu: Menu | undefined = undefined,
      id: string | undefined = undefined;

    if (next_menu == null) return { status, menu };

    if (typeof next_menu == "string") {
      id = next_menu;
      status = true;
    } else if (typeof next_menu == "function") {
      id = await next_menu(this.request, this.response);
      status = true;
    }

    if (status) {
      menu = this.instantiateMenu(this.router.getMenu(id!));
      state.menu!.visited[state.menu!.nextMenu!] = true;
      delete state.menu!.visited[id!];

      this.setCurrentMenu(id!, state);
    }

    return { status, menu };
  }

  private instantiateMenu(menu: Menu): Menu {
    if (menuType(menu) == "class") {
      if (menu instanceof BaseMenu) {
        return menu;
      }

      // @ts-ignore
      return new menu(this.request, this.response);
    }

    return menu;
  }

  private async lookupMenuOptions(state: State, menu: Menu) {
    let actions: MenuAction[] = [];

    if (menuType(menu) == "class") {
      actions = await (menu as unknown as BaseMenu).actions();
    } else {
      actions = (menu as DynamicMenu).getActions();
    }

    // Loop through the actions, and find the one that matches the user input
    const input = state.userData;
    for (const action of actions) {
      if (typeof action.choice == "function") {
        const result = await action.choice(input, this.request, this.response);
        if (result == input) {
          state.action = action;
          break;
        }
      }

      if (
        typeof action.choice == "string" ||
        typeof action.choice == "number"
      ) {
        if (action.choice == input || action.choice == "*") {
          state.action = action;
          break;
        }
      }

      try {
        if ((action.choice as RegExp).test(input)) {
          state.action = action;
          break;
        }
      } catch (e) { }
    }

    this.session.setState(state.sessionId, state);
  }

  private async lookupMenu(state: State) {
    let menu: Menu | undefined = undefined,
      id: string | undefined = state.menu?.nextMenu;

    // The user already has unterminated session, return the last visited menu
    if (id != null) {
      menu = this.router.getMenu(id);
    } else if (state.isStart) {
      // If it is a start request, lookup for the start menu
      const value = await this.router.getStartMenu(this.request, this.response);
      id = value.id;
      menu = value.obj;
    }

    if (menu == null) {
      throw new Error(`Menu for #${state.sessionId} is not defined`);
    }

    const instance = this.instantiateMenu(menu);
    this.setCurrentMenu(id!, state);

    // Update session mode
    state.mode = StateMode.more;
    return instance;
  }

  private async resolveGateway(stage: "request" | "response") {
    if (stage == "request") {
      const item = new this.config.gateway(this.request, this.response);
      const _state = (await item.handleRequest(this.request, this.response))!;
      await this.session.setState(_state.sessionId, _state)!;

      return _state;
    }

    if (stage == "response") {
      const item = new this.config.gateway(this.request, this.response);
      await item.handleResponse(this.request, this.response);
    }

    return;
  }

  private async endSession(state: State) {
    state.end();
    await this.session.clear(state.sessionId);
  }

  /**
   * Exposes a simplified session API interface to be used in menus
   *
   */
  getSession(): Session {
    return {
      // TODO: add delete
      get: async <T>(key: string, defaultValue?: any) => {
        return await Config.getInstance().session?.get<T>(
          this.request.state.sessionId!,
          key,
          defaultValue,
        );
      },
      getAll: <T>() => {
        return Config.getInstance().session?.getAll<T>(
          this.request.state.sessionId,
        );
      },
      set: (key: string, val: any) =>
        Config.getInstance().session?.set(
          this.request.state.sessionId,
          key,
          val,
        ),
    };
  }
}
