import App from "../src/core/app.core";
import { DefaultMiddleware } from "../src/middlewares/default.middleware";
// import router from "../src/models/router";
// import { BaseAction } from "../src/models/action";
import router, { BaseMenu } from "../src/models/menus.model";

class TestMenu extends BaseMenu {
  async nextMenu() {
    return undefined;
  }

  async message() {
    // this.request.body = "hello";
    // this.response.end("hello");
    return "hello";
  }
}

const app = new App().configure({ middlewares: [DefaultMiddleware] });

router
  .menu("first")
  .start()
  .message("Hello, it is working")
  .actions([
    {
      choice: "1",
      display: "1. Hi there",
      // validation: /regex/,
      name: "first",
    },
    {
      choice: "2",
      display: "2. Mimore there",
      next_menu: "second",
      name: "second",
    },
  ]);

router.add(TestMenu, "second");

// console.log(JSON.stringify(router, null, 2));

app.listen(3000, "localhost", () => {
  console.log("Server listening on port 3000");
});
