import { connect } from "mongoose";
import { Ananse, Request, Response } from "../../../src";
import router from "../../../src/menus";
import { WigalGateway } from "../../../src/gateways/wigal.gateway";
import { MenuType } from "./enums";

connect("mongodb://127.0.0.1:27017/starmicro-ussd").catch((err) =>
  console.error(err)
);

const app = new Ananse().configure({
  gateway: "wigal",
  // TODO: rename to 'customGateway' or extend 'gateway' to accept custom gateway class
  middlewares: [WigalGateway],
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

export default app;
