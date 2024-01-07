import { App, Request, Response } from "../../../src";
import router from "../../../src/menus";
import { DefaultMiddleware } from "../../../src/middlewares/default.middleware";
import { MenuType } from "./enums";
import { AccountLogin } from "./login.menu";

const app = new App().configure({
  middlewares: [DefaultMiddleware],
  session: { type: "redis" }, // TODO: implement mongodb session
});

// Account selection
router
  .menu(MenuType.account_type)
  .start()
  .message("Choose account type")
  .actions([
    {
      choice: "1",
      display: "1. Customer",
      next_menu: MenuType.customer,
      next_input: async (req: Request, res) => {
        const exists = await Customer.exists({
          phone_number: req.state.msisdn,
        });
        if (!exists) {
          return MenuType.customer_registration;
        }
        return MenuType.customer_login;
      },
    },
    {
      choice: "2",
      display: "2. Sales Executive",
      next_menu: MenuType.sales_executive,
    },
  ]);

// Account login
router.add(AccountLogin, MenuType.account_login);

import "./menus/client/index";
import { Customer } from "./models/customer";

app.listen(3000, "localhost", () => {
  console.log("Server listening on port 3000");
});
