import { Type, ValidationResponse } from "@src/types";
import { Request, Response } from "@src/types/request";
import { State } from "@src/models/ussd-state";
import { ServerResponse, IncomingMessage } from "http";
import { createServer } from "http";
import { parse } from "url";
import router, { DynamicMenu, Menu, Menus } from "@src/menus";
import { Config, ConfigOptions } from "@src/config";
import { BaseMenu, MenuAction } from "@src/menus";
import { MENU_CACHE } from "./state.core";
import { menuType } from "@src/helpers/index.helper";
import { FormMenuHandler } from "./form_handler";

// TODO: change to project name
class App {
  private request: Request;
  private response: Response;

  private router: Menus;
  // private current_route: Route;

  // private currentState: State;
  private _currentMenu: Menu;

  // private middlewares: Type<Middleware>[] = [];

  private errorMessage: string | undefined = undefined;

  /**
   * Track the state of the USSD session
   */
  // private readonly states: { [msisdn: string]: State } = {};

  configure(opts: ConfigOptions) {
    const instance = Config.getInstance();
    instance.init(opts);

    return this;
  }

  private get currentMenu(): Menu {
    return this._currentMenu;
  }

  private async setCurrentMenu(id: string, val: Menu, state?: State) {
    this._currentMenu = val;

    if (state != null) {
      state.menu = id;
      await this.session.setState(state.sessionId, state);
    }
  }

  private get config(): Config {
    return Config.getInstance();
  }

  private get session() {
    return this.config.session!;
  }

  private async isFormMenu() {
    if (menuType(this.currentMenu) == "class") {
      return (
        (await (this.currentMenu as unknown as BaseMenu).isForm()) || false
      );
    } else {
      return await (this.currentMenu as DynamicMenu).isFormMenu;
    }
  }
  // private get currentMenu(): Menu {
  //   return this.currentState.menu;
  // }

  private menuType(val?: Menu): "class" | "dynamic" {
    if (/^DynamicMenu$/i.test((val || this.currentMenu).constructor.name)) {
      return "dynamic";
    }
    return "class";
  }

  listen(port?: number, hostname?: string, listeningListener?: () => void) {
    // TODO: Resolve all menu naming conflicts and other sanity checks before starting the server
    return createServer((req, res) => this.requestListener(req, res)).listen(
      port,
      hostname,
      listeningListener
    );
  }

  // get currentState() {
  //   return Config.getInstance().session?.getState(
  //     this.request.state?.sessionId
  //   )!;
  // }

  private async handle() {
    this.router = router;
    // TODO: implement framework logic
    // 1. Process request via middleware
    // 2. Lookup route
    //  2a. Process request in route
    // 3. Process response via middleware

    // FIXME: optmize state access for persistent session.
    // ! Pass state as args to the functions and update the state after the last function returns

    // Resolve middlewares
    const state = (await this.resolveMiddlewares("request"))!;
    this.request.state = state;

    // Lookup menu
    await this.lookupMenu(state);

    // If current menu is a form, use form handler
    if (await this.isFormMenu()) {
      const formHandler = new FormMenuHandler(
        this.request,
        this.response,
        this.currentMenu
      );
      await formHandler.handle();
    } else {
      // Resolve menu options
      await this.lookupMenuOptions(state);

      await this.resolveMenuOption(state);

      // Validate user data
      const status = await this.validateUserData(state);

      // const _tempState = (await this.currentState)!;
      // If there's validation error, the user cannot be moved to the next menu (error source),
      // the user must still be on the current menu until the input passes validation
      if (status != true) {
        this.response.data = await this.buildResponse(
          MENU_CACHE[state.previousMenu!]
        );
      } else {
        // Again, we have to recheck if the menu is a form
        // This is necessary because if the selected option leads to a form menu,
        // form handler has to be used to build the response
        if (await this.isFormMenu()) {
          const formHandler = new FormMenuHandler(
            this.request,
            this.response,
            this.currentMenu
          );
          await formHandler.handle();
        } else {
          this.response.data = await this.buildResponse(this.currentMenu);
        }
      }
      // TODO: cache current state
    }

    // Reset temp fields
    state.action = undefined;
    this.errorMessage = undefined;
    await this.session.setState(state.sessionId, state);

    // Resolve middlewares
    await this.resolveMiddlewares("response");
  }

  private async validateUserData(state: State): Promise<ValidationResponse> {
    let status: ValidationResponse = true;
    if (this.menuType() == "class") {
      status = await (this.currentMenu as unknown as BaseMenu).validate(
        state?.userData
      );
    } else {
      status = await (this.currentMenu as DynamicMenu).validateInput(
        this.request,
        this.response
      );
    }

    if (typeof status == "string" || status == false) {
      // TODO: if no text is provided, return the current text
      this.errorMessage = status || "Invalid input";
    }
    return status;
  }

  private async buildResponse(menu: Menu) {
    // FIXME: simply response builder. If error message is not empty, we simply show else fallback to menu message/display
    let message = "";

    // If error message is not empty, we simply show that instead of calling
    // menu handler function. However, we append the actions to the response
    if (this.errorMessage == null) {
      if (this.menuType() == "class") {
        message = await (menu as unknown as BaseMenu).message();
      } else {
        message = await (menu as DynamicMenu).getMessage(
          this.request,
          this.response
        );
      }
    } else {
      message = this.errorMessage;
    }

    if (this.menuType() == "class") {
      for await (const action of await (
        menu as unknown as BaseMenu
      ).actions()) {
        if (action.display == null) continue;

        if (typeof action.display == "function") {
          message += "\n" + (await action.display(this.request, this.response));
        } else {
          message += "\n" + action.display || "";
        }
      }
      return message;
    }

    for await (const action of await (
      this.currentMenu as DynamicMenu
    ).getActions()) {
      if (action.display == null) continue;

      if (typeof action.display == "function") {
        message += "\n" + (await action.display(this.request, this.response));
      } else {
        message += "\n" + action.display || "";
      }
    }
    return message;
  }

  private async resolveMenuOption(state: State) {
    const action = state.action;

    // Execute the action handler
    if (action?.handler != null) {
      await action.handler(this.request, this.session);
    }

    // Resolve next menu and make it the current menu
    let _menu: Menu;

    if (typeof action?.next_menu == "string") {
      await this.setCurrentMenu(
        action.next_menu!,
        this.instantiateMenu(this.router.getMenu(action.next_menu!)),
        state
      );
      return this.currentMenu;
    } else if (typeof action?.next_menu == "function") {
      const id = await action.next_menu(this.request, this.response);

      await this.setCurrentMenu(
        id,
        this.instantiateMenu(this.router.getMenu(id)),
        state
      );

      return this.currentMenu;
    }

    // Fallback to default next menu
    _menu = this.instantiateMenu(this.currentMenu);
    if (this.menuType(_menu) == "class") {
      const _next = await (_menu as unknown as BaseMenu).nextMenu();
      if (_next == null) {
        state.mode = "end";
        await this.session.setState(state.sessionId, state);
        return;
      }

      await this.setCurrentMenu(
        _next,
        this.instantiateMenu(this.router.getMenu(_next)),
        state
      );

      return;
    }

    const _next = await (_menu as DynamicMenu).getDefaultNextMenu(
      this.request,
      this.response
    );

    if (_next != null) {
      await this.setCurrentMenu(
        _next,
        this.instantiateMenu(this.router.getMenu(_next)),
        state
      );
    }

    state.mode = state.isStart ? "more" : "end";
    await this.session.setState(state.sessionId, state);

    return;
  }

  private instantiateMenu(menu: Menu) {
    if (this.menuType(menu) == "class") {
      if (menu instanceof BaseMenu) {
        return menu;
      }

      // @ts-ignore
      this._currentMenu = new menu(this.request, this.response);
      return this.currentMenu;
    }

    return menu;
  }

  private async lookupMenuOptions(state: State) {
    let actions: MenuAction[] = [];

    if (this.menuType() == "class") {
      actions = await (this.currentMenu as unknown as BaseMenu).actions();
    } else {
      actions = (this.currentMenu as DynamicMenu).getActions();
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
      id: string | undefined = undefined;

    // If the request is a start request, we need to lookup the start menu
    if (state.isStart) {
      const _value = this.router.getStartMenu(this.request, this.response);
      id = _value.id;
      menu = _value.obj;
    } else {
      if (state.menu == null) {
        throw new Error(`Menu for #${state.sessionId} is not defined`);
      }

      menu = this.currentMenu;
      // menu = this.currentState.menu;
    }

    this.setCurrentMenu(id!, this.instantiateMenu(menu), state);
  }

  private async resolveMiddlewares(stage: "request" | "response") {
    if (stage == "request") {
      for (const middleware of this.config.middlewares) {
        const item = new middleware(this.request, this.response);
        const _state = (await item.handleRequest(this.request, this.response))!;
        await this.session.setState(_state.sessionId, _state)!;

        return _state;
        // await this.session.setState(item.sessionId, this.request.state);
        // this.currentState = (await this.session.getState(item.sessionId))!;
      }
    }

    if (stage == "response") {
      for (const middleware of this.config.middlewares) {
        const item = new middleware(this.request, this.response);
        await item.handleResponse(this.request, this.response);
        // this.states[this.request.state.msisdn] = this.request.state;
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

    this.request = request;
    this.response = res as Response;
    await this.handle();
  }
}

export default App;
