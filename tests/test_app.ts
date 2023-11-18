import App from "../src/core/app.core";
import { DefaultMiddleware } from "../src/middlewares/default.middleware";
// import router from "../src/models/router";
// import { BaseAction } from "../src/models/action";
import router, { BaseMenu } from "../src/models/menus.model";

class TestAction extends BaseMenu {
  async nextMenu() {
    return undefined;
  }

  async message() {
    // this.request.body = "hello";
    this.response.end("hello");
    return "hello";
  }
}

const app = new App().configure({ middlewares: [DefaultMiddleware] });

router
  .menu("first")
  .start()
  .actions([
    {
      choice: "1",
      display: "Helo, it is working",
      // validation: /regex/,
      name: "first",
    },
    { choice: "2", next_menu: "second", name: "second" },
  ]);

router.add(TestAction, "second");

console.log(JSON.stringify(router, null, 2));

app.listen(3000, "localhost", () => {
  console.log("Server listening on port 3000");
});
