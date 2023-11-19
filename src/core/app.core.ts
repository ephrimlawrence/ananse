import { Type, ValidationResponse } from "@src/types";
import { Request, Response } from "@src/types/request";
import { Middleware } from "@src/middlewares/base.middleware";
import { DefaultMiddleware } from "@src/middlewares/default.middleware";
// import router, { Route } from "@src/models/router";
import { State } from "@src/models/ussd-state";
import { ServerResponse, IncomingMessage, IncomingHttpHeaders } from "http";
import { createServer } from "http";
import { parse } from "url";
import router, {
  BaseMenu,
  DynamicMenu,
  Menu,
  MenuAction,
  Menus,
} from "@src/models/menus.model";
import { Session } from "./session.core";

// TODO: change to project name
class App {
  private request: Request;
  private response: Response;

  private router: Menus;
  // private current_route: Route;

  private currentState: State;
  // private currentMenu: Menu;

  private middlewares: Type<Middleware>[] = [];

  private errorMessage: string | undefined = undefined;

  /**
   * Track the state of the USSD session
   */
  // private readonly states: { [msisdn: string]: State } = {};

  configure(opts: { middlewares?: Type<Middleware>[] }) {
    if ((opts.middlewares || []).length == 0) {
      this.middlewares = [DefaultMiddleware];
    } else {
      this.middlewares = opts.middlewares!;
    }

    return this;
  }

  private get session(): Session {
    return Session.getInstance();
  }

  private get currentMenu(): Menu {
    return this.currentState.menu;
  }

  private menuType(val?: Menu): "class" | "dynamic" {
    if (!/DynamicMenu$/i.test((val || this.currentMenu).constructor.name)) {
      return "class";
    }

    return "dynamic";
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
  //   return this.states[this.request.state?.msisdn];
  // }

  private async handle() {
    this.router = router;
    // TODO: implement framework logic
    // 1. Process request via middleware
    // 2. Lookup route
    //  2a. Process request in route
    // 3. Process response via middleware

    // Resolve middlewares
    await this.resolveMiddlewares("request");

    // Lookup menu
    await this.lookupMenu();

    // Resolve menu options
    await this.lookupMenuOptions();

    await this.resolveMenuOption();

    // Validate user data
    const status = await this.validateUserData();

    // If there's validation error, the user cannot be moved to the next menu (error source),
    // the user must still be on the current menu until the input passes validation
    if (status != true) {
      this.response.data = await this.buildResponse(
        this.currentState.previousMenu!
      );
    } else {
      this.response.data = await this.buildResponse(this.currentMenu);
    }
    // TODO: cache current state

    // Reset temp fields
    this.currentState.action = undefined;
    this.errorMessage = undefined;

    // Resolve middlewares
    await this.resolveMiddlewares("response");
  }

  private async validateUserData(): Promise<ValidationResponse> {
    let status: ValidationResponse = true;
    if (this.menuType() == "class") {
      status = await (this.currentMenu as unknown as BaseMenu).validate(
        this.currentState.userData
      );
    }
    status = await (this.currentMenu as DynamicMenu).validateInput(
      this.request,
      this.response
    );

    if (typeof status == "string" || status == false) {
      this.errorMessage = status || "Invalid input";
    }
    return status;
  }

  private async buildResponse(menu: Menu) {
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
      if (typeof action.display == "function") {
        message += "\n" + (await action.display(this.request, this.response));
      } else {
        message += "\n" + action.display || "";
      }
    }
    return message;
  }

  private async resolveMenuOption() {
    const action = this.currentState.action;

    // if (this.currentState.isStart) {
    //   return;
    // }
    // if (action == null) {
    // let _menu = this.instantiateMenu(this.currentMenu);

    // }

    // Resolve next menu and make it the current menu
    let _menu: Menu;

    if (typeof action?.next_menu == "string") {
      this.currentState.menu = this.instantiateMenu(
        this.router.getMenu(action.next_menu!)
      );
      return this.currentState.menu;
    } else if (typeof action?.next_menu == "function") {
      this.currentState.menu = this.instantiateMenu(
        this.router.getMenu(await action.next_menu(this.request, this.response))
      );
      return this.currentState.menu;
    }

    // Fallback to default next menu
    _menu = this.instantiateMenu(this.currentMenu);
    if (this.menuType(_menu) == "class") {
      const _next = await (_menu as unknown as BaseMenu).nextMenu();
      if (_next == null) {
        this.currentState.mode = "end";
        return;
      }

      this.currentState.menu = this.instantiateMenu(this.router.getMenu(_next));
      return;
    }

    const _next = await (_menu as DynamicMenu).getDefaultNextMenu(
      this.request,
      this.response
    );

    if (_next != null) {
      this.currentState.menu = this.instantiateMenu(
        this.router.getMenu(_next!)
      );
    }
    this.currentState.mode = this.currentState.isStart ? "more" : "end";

    return;
  }

  private instantiateMenu(menu: Menu) {
    if (this.menuType(menu) == "class") {
      if (menu instanceof BaseMenu) {
        return menu;
      }

      // @ts-ignore
      this.currentState.menu = new menu(this.request, this.response);
      return this.currentState.menu;
    }

    return menu;
  }

  private async lookupMenuOptions() {
    let actions: MenuAction[] = [];

    if (this.menuType() == "class") {
      actions = await (this.currentMenu as unknown as BaseMenu).actions();
    } else {
      actions = (this.currentMenu as DynamicMenu).getActions();
    }

    // if (actions.length == 0) {
    //   throw new Error(
    //     `Menu #${this.currentMenu.toString()} has no actions. At least one option must be defined`
    //   );
    // }

    // if (this.currentState.isStart) {
    //   this.currentState.action = actions[0];
    //   return this.currentState.action;
    // }

    // Loop through the actions, and find the one that matches the user input
    const input = this.currentState.userData;
    for (const action of actions) {
      if (typeof action.choice == "function") {
        const result = await action.choice(input, this.request, this.response);
        if (result == input) {
          this.currentState.action = action;
          break;
        }
      }

      if (typeof action.choice == "string") {
        if (action.choice == input || action.choice == "*") {
          this.currentState.action = action;
          break;
        }
      }

      try {
        if ((action.choice as RegExp).test(input)) {
          this.currentState.action = action;
          break;
        }
      } catch (e) {}
    }
  }

  private async lookupMenu() {
    let menu: Menu | undefined = undefined;

    // If the request is a start request, we need to lookup the start menu
    if (this.currentState.isStart) {
      menu = this.router.getStartMenu(this.request, this.response);
    } else {
      if (this.currentState.menu == null) {
        throw new Error(
          `Menu for #${this.currentState.sessionId} is not defined`
        );
      }

      menu = this.currentState.menu;
    }

    this.currentState.menu = this.instantiateMenu(menu);
  }

  private async resolveMiddlewares(stage: "request" | "response") {
    if (stage == "request") {
      for (const middleware of this.middlewares) {
        const item = new middleware(this.request, this.response);
        await item.handleRequest(this.request, this.response);

        this.session.setState(item.sessionId, this.request.state);
        this.currentState = this.session.getState(item.sessionId)!;
      }
    }

    if (stage == "response") {
      for (const middleware of this.middlewares) {
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
