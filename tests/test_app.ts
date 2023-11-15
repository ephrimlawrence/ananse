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

const app = new App().configure({ middlewares: [DefaultMiddleware] });

router
  .menu("main")
  .start()
  .options([
    {
      choice: "1",
      display: "Helo, it is working",
      validation: /regex/,
      name: "first",
    },
    { choice: "2", action: TestAction, next_menu: "main", name: "second" },
  ])
  .back("main");

console.log(JSON.stringify(router, null, 2));

app.listen(3000, "localhost", () => {
  console.log("Server listening on port 3000");
});
