import { Type } from "@src/types";
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

// TODO: change to project name
class App {
  private request: Request;
  private response: Response;

  private router: Menus;
  // private current_route: Route;

  private currentState: State;
  // private currentMenu: Menu;

  private middlewares: Type<Middleware>[] = [];

  /**
   * Track the state of the USSD session
   */
  private readonly states: { [msisdn: string]: State } = {};

  configure(opts: { middlewares?: Type<Middleware>[] }) {
    if ((opts.middlewares || []).length == 0) {
      this.middlewares = [DefaultMiddleware];
    } else {
      this.middlewares = opts.middlewares!;
    }

    return this;
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

    this.response.data = await this.buildResponse();
    // TODO: cache current state

    // Resolve middlewares
    await this.resolveMiddlewares("response");

    // console.log(this.currentMenu);

    // console.log(this.request.state);
    // this.response.setHeader("Content-Type", "application/json");
    // this.response.writeHead(200);
    // this.response.end("Hello, World!");
  }

  private async buildResponse() {
    if (this.menuType() == "class") {
      const menu = this.currentMenu as unknown as BaseMenu;
      let message = await menu.message();

      for await (const action of await menu.actions()) {
        if (typeof action.display == "function") {
          message += "\n" + (await action.display(this.request, this.response));
        } else {
          message += "\n" + action.display || "";
        }
      }
      return message;
    }

    let message = await (this.currentMenu as DynamicMenu).getMessage(
      this.request,
      this.response
    );

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
    if (_next == null) {
      this.currentState.mode = "end";
      return;
    }

    this.currentState.menu = this.instantiateMenu(this.router.getMenu(_next));
    return;

    // if (action?.next_menu == null) {
    //   this.currentState.mode = "end";
    //   return this.currentState;
    // }
    // this.currentState.menu = this.instantiateMenu(_menu);
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

    if (actions.length == 0) {
      throw new Error(
        `Menu #${this.currentMenu.toString()} has no actions. At least one option must be defined`
      );
    }

    if (this.currentState.isStart) {
      this.currentState.action = actions[0];
      return this.currentState.action;
    }

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

      try {
        const regex = new RegExp(action.choice.toString());
        if (regex.test(input)) {
          this.currentState.action = action;
          break;
        }
      } catch (e) {}

      if (typeof action.choice == "string") {
        if (action.choice == input || action.choice == "*") {
          this.currentState.action = action;
          break;
        }
      }
    }

    // if (this.currentState.action == null) {
    //   throw new Error(
    //     `No action found for input ${input} in menu ${this.currentMenu.toString()}`
    //   );
    // }
  }

  private async lookupMenu() {
    let menu: Menu | undefined = undefined;

    console.log(this.currentState);

    // If the request is a start request, we need to lookup the start menu
    if (this.currentState.isStart) {
      menu = this.router.getStartMenu(this.request, this.response);
    } else {
      if (this.currentState.menu == null) {
        throw new Error(
          `Menu for #${this.currentState.sessionId} is not defined`
        );
      }

      // if (this.currentState.nextMenu == null) {
      //   throw new Error(
      //     `Next menu for #${this.currentState.sessionId} is not defined`
      //   );
      // }

      // If the request is not a start request, we need to lookup the current menu
      // menu = this.router.getMenu(this.currentState.menu);
      menu = this.currentState.menu;
    }

    if (this.menuType(menu) == "class") {
      if (menu instanceof BaseMenu) {
        return (this.currentState.menu = menu);
      } else {
        // @ts-ignore
        this.currentState.menu = new menu(this.request, this.response);
        return this.currentState.menu;
      }
    }

    this.currentState.menu = menu;
  }

  private async resolveMiddlewares(stage: "request" | "response") {
    if (stage == "request") {
      for (const middleware of this.middlewares) {
        const item = new middleware(this.request, this.response);
        await item.handleRequest(this.request, this.response);

        this.states[item.sessionId] = this.request.state;
        this.currentState = this.states[item.sessionId];
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
