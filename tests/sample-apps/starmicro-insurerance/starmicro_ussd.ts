import App from "../../../src/core/app.core";
import router from "../../../src/menus";
import { DefaultMiddleware } from "../../../src/middlewares/default.middleware";
import { MenuType } from "./enums";
import { AccountLogin } from "./login.menu";

const app = new App().configure({
  middlewares: [DefaultMiddleware],
  session: { type: "redis" },
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
      next_input: async (req, res) => {
        // Redirect to customer registration menu, if customer does not exist
        // else, redirect to customer login menu
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

app.listen(3000, "localhost", () => {
  console.log("Server listening on port 3000");
});
