import { Request, Response } from "@src/interfaces/request";
import router, { Route } from "@src/models/router";

// TODO: change to project name
class App {
  private router: Route;

  constructor(private request: Request, private response: Response) {
    this.router = router;
  }

  async handle() {
    // TODO: implement framework logic
    // 1. Process request via middleware
    // 2. Lookup route
    //  2a. Process request in route
    // 3. Process response via middleware

    this.response.end("Hello, World!");
  }
}

export default App;
