import { Request, Response } from "@src/interfaces/request";
import { Middleware } from "@src/middlewares/base.middleware";
import { DefaultMiddleware } from "@src/middlewares/default.middleware";
import router, { Menu, Route } from "@src/models/router";
import { USSDState } from "@src/models/ussd-state";

// TODO: change to project name
class App {
  private router: Route;
  // private current_route: Route;
  private currentMenu: Menu;

  private middlewares: Middleware[] = [];

  /**
   * Track the state of the USSD session
   */
  private readonly states: { [msisdn: string]: USSDState } = {};

  constructor(private request: Request, private response: Response) {
    this.router = router;
  }

  configure(opts: { middlewares?: Middleware[] }) {
    if ((opts.middlewares || []).length == 0) {
      this.middlewares = [new DefaultMiddleware()];
    } else {
      this.middlewares = opts.middlewares!;
    }

    return this;
  }

  async handle() {
    // TODO: implement framework logic
    // 1. Process request via middleware
    // 2. Lookup route
    //  2a. Process request in route
    // 3. Process response via middleware

    // Resolve middlewares
    await this.resolveMiddlewares();

    // Lookup menu
    await this.lookupMenu();

    // Resolve menu options

    console.log(this.currentMenu);

    console.log(this.request.state);
    this.response.setHeader("Content-Type", "application/json");
    this.response.writeHead(200);
    this.response.end("Hello, World!");
  }

  get currentState() {
    return this.states[this.request.state.msisdn];
  }

  private async lookupMenu() {
    // If the request is a start request, we need to lookup the start menu
    if (this.currentState.isStart) {
      this.currentMenu = this.router.startMenu;
    }
  }

  private async resolveMiddlewares() {
    for (const middleware of this.middlewares) {
      await middleware.handleRequest(this.request, this.response);
      this.states[this.request.state.msisdn] = this.request.state;
    }

    return;
  }
}

export default App;
