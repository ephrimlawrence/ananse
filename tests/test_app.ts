import App from "../src/core/app.core";
import { DefaultMiddleware } from "../src/middlewares/default.middleware";
// import router from "../src/models/router";
// import { BaseAction } from "../src/models/action";
import router, { BaseMenu } from "../src/models/menus.model";

class SelfService extends BaseMenu {
  async nextMenu() {
    return undefined;
  }

  async message() {
    return "";
  }

  async actions() {
    return [
      {
        choice: "1",
        display: "1. Change PIN",
        // validation: /regex/,
        name: "change_pin",
      },
      {
        choice: "2",
        display: "2. Change Account Info",
        next_menu: "self_service.change_account_info",
        name: "self_service.change_account_info",
      },
      {
        choice: "3",
        display: "3. Close Account",
        name: "self_service.close_account",
      },
    ];
  }
}

const app = new App().configure({ middlewares: [DefaultMiddleware] });

router
  .menu("first")
  .start()
  .message("Hello, welcome to FirstTrust Bank")
  .actions([
    {
      choice: "1",
      display: "1. Check Balance",
      name: "check_balance",
    },
    {
      choice: "2",
      display: (_req, _res) => {
        return "2. Investment";
      },
      name: "investment",
    },
    {
      choice: "3",
      display: "3. Self Service",
      next_menu: "self_service",
      name: "self_service",
    },
  ]);

router.add(SelfService, "self_service");

// console.log(JSON.stringify(router, null, 2));

app.listen(3000, "localhost", () => {
  console.log("Server listening on port 3000");
});
