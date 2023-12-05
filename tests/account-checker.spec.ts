import { getActiveTest, test } from "@japa/runner";
import router, { BaseMenu } from "../src/menus";
import { DefaultMiddleware } from "../src/middlewares/default.middleware";
import App from "../src/core/app.core";
import { promisify } from "util";

class SelfService extends BaseMenu {
  async nextMenu() {
    // console.log(this.session.get("account_number"));
    return undefined;
  }

  async message() {
    this.session.set("account_number", "1234567890");

    // console.log(this.session.getAll());

    return "Self Service";
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
        next_menu: "self_service.close_account",
      },
    ];
  }
}
class CloseAccount extends BaseMenu {
  async nextMenu() {
    return undefined;
  }

  async message() {
    console.log(await this.session.get("account_number"));
    return "Are you sure you want to close your account?";
  }

  async actions() {
    return [
      {
        choice: "1",
        display: "1. No",
        name: "no",
      },
      {
        choice: "2",
        display: "2. Yes",
        name: "self_service.close_account.confirmed",
      },
    ];
  }
}

test.group("Maths.add", () => {
  test("ussd test 1", ({ ussd }) => {
    // console.log(ussd)
    console.log(ussd.setProvider("mtn").config);
  });
  test("add two numbers", ({ assert }) => {
    const app = new App().configure({
      middlewares: [DefaultMiddleware],
      session: { type: "redis" },
    });

    router
      .menu("first")
      .start()
      .message("Hello, welcome to FirstTrust Bank")
      .actions([
        {
          choice: "1",
          display: "1. Check Balance",
          name: "check_balance",
          next_menu: "check_balance",
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

    router
      .menu("check_balance")
      .message("Enter your account PIN")
      .defaultNextMenu("verify_pin");

    router
      .menu("verify_pin")
      .validation(/\d{4}/)
      .message("Your account balance is GHS12.000");
    // TODO: add .end() function

    router.add(SelfService, "self_service");
    router.add(CloseAccount, "self_service.close_account");

    // const test = getActiveTest();
    // test?.cleanup(() => promisify(app.close)());

    // app.listen(3000);

    // Test logic goes here
    assert.equal(1 + 1, 2);
  });
});
