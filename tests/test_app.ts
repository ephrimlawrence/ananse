import App from "../src/core/app.core";
import { DefaultMiddleware } from "../src/middlewares/default.middleware";
import router from "../src/models/router";
import { BaseAction } from "../src/models/action";

class TestAction extends BaseAction {
  message(): string {
    // this.request.body = "hello";
    this.response.end("hello");
    return "hello";
  }
}

const app = new App().configure({ middlewares: [new DefaultMiddleware()] });

router
  .menu("main")
  .start()
  .options([
    { choice: "1", display: "hello", validation: /regex/ },
    { choice: "2", action: TestAction, next_menu: "main" },
  ])
  .back("main");

console.log(JSON.stringify(router, null, 2));

app.listen(3000, "localhost", () => {
  console.log("Server listening on port 3000");
});
