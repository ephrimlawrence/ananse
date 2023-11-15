import { Request, Response } from "@src/interfaces/request";
import router, { Menu, Route } from "@src/models/router";
import { USSDState } from "@src/models/ussd-state";

// TODO: change to project name
class App {
  private router: Route;
  private current_route: Route;
  private current_state: Menu;

  /**
   * Track the state of the USSD session
   */
  private readonly states: { [msisdn: string]: USSDState } = {};

  constructor(private request: Request, private response: Response) {
    this.router = router;
  }

  async handle() {
    // TODO: implement framework logic
    // 1. Process request via middleware
    // 2. Lookup route
    //  2a. Process request in route
    // 3. Process response via middleware

    this.response.setHeader("Content-Type", "application/json");
    this.response.writeHead(200);
    this.response.end("Hello, World!");
  }
}

export default App;
