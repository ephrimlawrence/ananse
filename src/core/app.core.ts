import { Type } from "@src/types";
import { Request, Response } from "@src/types/request";
import { Middleware } from "@src/middlewares/base.middleware";
import { DefaultMiddleware } from "@src/middlewares/default.middleware";
import router, { Menu, MenuOption, Route } from "@src/models/router";
import { USSDState } from "@src/models/ussd-state";
import { ServerResponse, IncomingMessage, IncomingHttpHeaders } from "http";
import { createServer } from "http";
import { parse } from "url";

// TODO: change to project name
class App {
  private request: Request;
  private response: Response;

  private router: Route;
  // private current_route: Route;

  private currentState: USSDState;
  private currentMenu: Menu;

  private middlewares: Type<Middleware>[] = [];

  /**
   * Track the state of the USSD session
   */
  private readonly states: { [msisdn: string]: USSDState } = {};

  configure(opts: { middlewares?: Type<Middleware>[] }) {
    if ((opts.middlewares || []).length == 0) {
      this.middlewares = [DefaultMiddleware];
    } else {
      this.middlewares = opts.middlewares!;
    }

    return this;
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

    await this.handleNextOption();

    // TODO: cache current state

    // Resolve middlewares
    await this.resolveMiddlewares("response");

    console.log(this.currentMenu);

    console.log(this.request.state);
    // this.response.setHeader("Content-Type", "application/json");
    // this.response.writeHead(200);
    // this.response.end("Hello, World!");
  }

  private async resolveMenuOption() {
    const option = this.currentState.option;
    // TODO:add action?
    if (option?.display != null) {
      this.response.data = option.display;
    }

    // TODO: resolve acoitn & validation
  }

  private async handleNextOption() {
    // TODO: handle next menu/option
    const action = this.currentState.option;

    if (action?.next_menu == null) {
      this.currentState.mode = "end";
      return this.currentState;
    }

    if (typeof action.next_menu == "string") {
      this.currentState.nextMenu = this.router.getMenu(action?.next_menu);
    } else {
      this.currentState.nextMenu = this.router.getMenu(
        action.next_menu(this.request, this.response)
      );
    }
  }

  private async lookupMenuOptions() {
    if (this.currentMenu.getOptions().length == 0) {
      throw new Error(
        `Menu #${this.currentMenu.id} has no options. At least one option must be defined`
      );
    }

    if (this.currentState.isStart) {
      this.currentState.option = this.currentMenu.getOptions()[0];
      return this.currentState.option;
    }
    // TODO: Handle other request types
    // let option: MenuOption = undefined;
  }

  private async lookupMenu() {
    // If the request is a start request, we need to lookup the start menu
    if (this.currentState.isStart) {
      this.currentMenu = this.router.startMenu;
    }

    // TODO: Handle other request types
  }

  private async resolveMiddlewares(stage: "request" | "response") {
    if (stage == "request") {
      for (const middleware of this.middlewares) {
        const item = new middleware(this.currentState);
        await item.handleRequest(this.request, this.response);

        this.states[item.sessionId] = this.request.state;
        this.currentState = this.states[item.sessionId];
      }
    }

    if (stage == "response") {
      for (const middleware of this.middlewares) {
        const item = new middleware(this.currentState);
        await item.handleResponse(this.request, this.response);
        // this.states[this.request.state.msisdn] = this.request.state;
      }
    }

    return;
  }

  private async requestListener(req: IncomingMessage, res: ServerResponse) {
    console.log("hellow");
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
