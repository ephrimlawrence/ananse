import { Request, Response } from "@src/interfaces/request";
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
  private currentMenu: Menu;

  private middlewares: Middleware[] = [];

  /**
   * Track the state of the USSD session
   */
  private readonly states: { [msisdn: string]: USSDState } = {};

  configure(opts: { middlewares?: Middleware[] }) {
    if ((opts.middlewares || []).length == 0) {
      this.middlewares = [new DefaultMiddleware()];
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

  get currentState() {
    return this.states[this.request.state.msisdn];
  }

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
    if (option?.display != null) {
      this.response.data = option.display;
    }

    // TODO: resolve acoitn & validation
  }

  private async handleNextOption() {}

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
        await middleware.handleRequest(this.request, this.response);
        this.states[this.request.state.msisdn] = this.request.state;
      }
    }

    if (stage == "response") {
      for (const middleware of this.middlewares) {
        await middleware.handleResponse(this.request, this.response);
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
