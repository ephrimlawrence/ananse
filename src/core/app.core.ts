import { NextMenu, Type, ValidationResponse } from "@src/types";
import { Request, Response } from "@src/types/request";
import { State } from "@src/models/ussd-state";
import { ServerResponse, IncomingMessage } from "http";
import { createServer } from "http";
import { parse } from "url";
import router, { DynamicMenu, Menu, Menus } from "@src/menus";
import { Config, ConfigOptions } from "@src/config";
import { BaseMenu, MenuAction } from "@src/menus";
import { MENU_CACHE } from "./state.core";
import { menuType, validateInput } from "@src/helpers/index.helper";
import { FormMenuHandler } from "./form_handler";

// TODO: change to project name
export class App {
  private request: Request;
  private response: Response;

  private router: Menus;

  configure(opts: ConfigOptions) {
    const instance = Config.getInstance();
    instance.init(opts);

    return this;
  }

  getVisitedMenus(state: State): string[] {
    return Object.keys(state.form?.submitted ?? {}) || [];
  }

  private async setCurrentMenu(id: string, val: Menu, state: State) {
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

  listen(port?: number, hostname?: string, listeningListener?: () => void) {
    // TODO: Resolve all menu naming conflicts and other sanity checks before starting the server
    return createServer((req, res) => this.requestListener(req, res)).listen(
      port,
      hostname,
      listeningListener
    );
  }

  private async formHandler(currentMenu: Menu, state: State) {
    const formHandler = new FormMenuHandler(
      this.request,
      this.response,
      currentMenu
    );
    const nextMenu = await formHandler.handle();

    if (!state.isEnd) {
      await this.session.setState(state.sessionId, state);
    }

    if (nextMenu != null) {
      currentMenu = (await this.navigateToNextMenu(state, nextMenu)).menu!;
      this.response.data = await this.buildResponse(currentMenu, state);

      await this.resolveMiddlewares("response");
      return this.response;
    }

    await this.resolveMiddlewares("response");
    return this.response;
  }

  private async handle() {
    this.router = router;

    let currentMenu: Menu | undefined = undefined;

    // TODO: implement framework logic
    // 1. Process request via middleware
    // 2. Lookup route
    //  2a. Process request in route
    // 3. Process response via middleware

    // FIXME: optmize state access for persistent session.
    // ! Pass state as args to the functions and update the state after the last function returns

    // Resolve middlewares
    const state = (await this.resolveMiddlewares("request"))!;

    // Initialize state menu object
    state.menu ??= {
      nextMenu: undefined,
      visited: {},
    };
    this.request.state = state;

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

      await this.resolveMiddlewares("response");
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
      await this.resolveMiddlewares("response");

      return this.response;
    }

    currentMenu = await this.resolveNextMenu(state, currentMenu);

    if (currentMenu != null) {
      // Next menu is a form, use form handler to build response
      if (await this.isFormMenu(currentMenu)) {
        return this.formHandler(currentMenu, state);
      }
    }

    this.response.data = await this.buildResponse(currentMenu, state);

    await this.resolveMiddlewares("response");
    return this.response;

    // // If current menu is a form, use form handler
    // if (await this.isFormMenu(currentMenu)) {
    //   state.menu = state.menu || state.previousMenu!;
    //   this.navigateToNextMenu(state, state.menu);
    //   const formHandler = new FormMenuHandler(
    //     this.request,
    //     this.response,
    //     this.currentMenu
    //   );
    //   const nextMenu = await formHandler.handle();
    //   if (nextMenu != null) {
    //     this.navigateToNextMenu(state, nextMenu);
    //     this.response.data = await this.buildResponse(this.currentMenu);
    //   }
    //   // TODO: redirect to next menu if exists by setting currentMenu to this
    // } else {
    //   // Resolve menu options
    //   // await this.lookupMenuOptions(state, currentMenu);

    //   // await this.resolveMenuOption(state);

    //   // Validate user data
    //   // const status = await this.validateUserData(state);

    //   // const _tempState = (await this.currentState)!;
    //   // If there's validation error, the user cannot be moved to the next menu (error source),
    //   // the user must still be on the current menu until the input passes validation
    //   if (error != true) {
    //     this.response.data = await this.buildResponse(
    //       MENU_CACHE[state.previousMenu!]
    //     );
    //   } else {
    //     // Again, we have to recheck if the menu is a form
    //     // This is necessary because if the selected option leads to a form menu,
    //     // form handler has to be used to build the response of the first input
    //     if (await this.isFormMenu()) {
    //       this.navigateToNextMenu(state, state.menu);
    //       const formHandler = new FormMenuHandler(
    //         this.request,
    //         this.response,
    //         this.currentMenu
    //       );
    //       const nextMenu = await formHandler.handle();
    //       if (nextMenu != null) {
    //         this.navigateToNextMenu(state, nextMenu);
    //       }
    //     } else {
    //       this.response.data = await this.buildResponse(this.currentMenu);
    //     }
    //   }
    //   // TODO: cache current state
    // }

    // // Reset temp fields
    // state.action = undefined;
    // this.errorMessage = undefined;

    // // TODO: don't do this if session is end
    // if (!state.isEnd) {
    //   await this.session.setState(state.sessionId, state);
    // }

    // // Resolve middlewares
    // await this.resolveMiddlewares("response");
  }

  private async validateUserData(
    state: State,
    menu: Menu,
    error?: string
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
    errorMessage?: string
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
        this.response
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
      await action.handler(this.request, this.session);
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
      this.response
    );

    if (_next != null) {
      return (await this.navigateToNextMenu(state, _next)).menu;
    }

    await this.endSession(state);
    return undefined;
  }

  /**
   * Resolve next menu and make it the current menu.
   *
   * @return  {boolean}              `true` if the next menu is resolved, `false` otherwise
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
      this.setCurrentMenu(id!, menu!, state);
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
      } catch (e) {}
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
      const value = this.router.getStartMenu(this.request, this.response);
      id = value.id;
      menu = value.obj;
    }

    if (menu == null) {
      throw new Error(`Menu for #${state.sessionId} is not defined`);
    }

    const instance = this.instantiateMenu(menu);
    this.setCurrentMenu(id!, instance, state);

    // Update session mode
    state.mode = "more";
    return instance;
  }

  private async resolveMiddlewares(stage: "request" | "response") {
    if (stage == "request") {
      for (const middleware of this.config.middlewares) {
        const item = new middleware(this.request, this.response);
        const _state = (await item.handleRequest(this.request, this.response))!;
        await this.session.setState(_state.sessionId, _state)!;

        return _state;
      }
    }

    if (stage == "response") {
      for (const middleware of this.config.middlewares) {
        const item = new middleware(this.request, this.response);
        await item.handleResponse(this.request, this.response);
      }
    }

    return;
  }

  private async requestListener(req: IncomingMessage, res: ServerResponse) {
    const request = new Request(parse(req.url!, true), req);

    if (req.method == "POST" || req.method == "PUT" || req.method == "PATCH") {
      let data = "";

      req.on("data", (chunk) => {
        data += chunk;
      });

      req.on("end", () => {
        try {
          if (req.headers["content-type"] == "application/json") {
            request.body = JSON.parse(data);
          }
          // TODO: parse other content types
        } catch (error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ error: "Invalid JSON format in the request body" })
          );
        }
      });

      // res.end("Hello, World!");
      // TODO: Handle request/response
    }

    // TODO: make request, and response local in handler, instead of global
    this.request = request;
    this.response = res as Response;
    await this.handle();
  }

  private async endSession(state: State) {
    state.end();
    await this.session.clear(state.sessionId);
  }
}

export default App;
