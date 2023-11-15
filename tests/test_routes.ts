import { server } from "../src/server.js";
import router from "../src/models/router.js";
import { BaseAction } from "../src/models/action.js";

class TestAction extends BaseAction {
  message(): string {
    // this.request.body = "hello";
    this.response.end("hello");
    return "hello";
  }
}
// const route = Route

router
  .menu("main")
  .options([
    { choice: "1", display: "hello", validation: /regex/ },
    { choice: "2", action: TestAction, next_menu: "main" },
  ])
  .back("main");

console.log(JSON.stringify(router, null, 2));
