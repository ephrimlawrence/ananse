import { connect } from "mongoose";
import { App, Request, Response } from "../../../src";
import router from "../../../src/menus";
import { DefaultMiddleware } from "../../../src/middlewares/default.middleware";
import { MenuType } from "./enums";
import { ClientLogin } from "./menus/customer/login.customer";

connect("mongodb://127.0.0.1:27017/starmicro-ussd").catch((err) =>
  console.error(err)
);

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
      next_menu: async (req: Request, _res: Response) => {
        const exists = await Customer.exists({
          phone_number: req.state.msisdn,
        });
        console.group(exists);
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

import "./menus/customer/index";
import { Customer } from "./models/customer";

app.listen(3000, "localhost", () => {
  console.log("Server listening on port 3000");
});
