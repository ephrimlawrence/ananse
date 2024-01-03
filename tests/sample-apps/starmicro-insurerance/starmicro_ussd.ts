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
      name: MenuType.customer,
      next_menu: MenuType.customer,
    },
    {
      choice: "2",
      display: "2. Sales Executive",
      name: MenuType.sales_executive,
      next_menu: MenuType.sales_executive,
    },
  ]);

// Account login
router.add(AccountLogin, MenuType.account_login);

// Client menus
router
  .menu(MenuType.customer)
  .start()
  .message("Welcome to Star MicroInsurance. Choose an Option")
  .actions([
    {
      choice: "1",
      display: "1. New Policy Registration",
      name: MenuType.customer_new_policy,
      next_menu: MenuType.customer_new_policy,
    },
    {
      choice: "2",
      display: "2. Pay Policy Premium",
      name: MenuType.client_premium_payment,
      next_menu: MenuType.client_premium_payment,
    },

    {
      choice: "3",
      display: "3. Collection Balance",
      name: MenuType.client_balance,
      next_menu: MenuType.client_balance,
    },
    {
      choice: "4",
      display: "4. Set up Direct Debit",
      name: MenuType.client_debit_setup,
      next_menu: MenuType.client_debit_setup,
    },
    {
      choice: "5",
      display: "5. Claims Request",
      name: MenuType.client_claim_request,
      next_menu: MenuType.client_claim_request,
    },
    {
      choice: "6",
      display: "6. Reset Pin",
      name: MenuType.client_reset_pin,
      next_menu: MenuType.client_reset_pin,
    },
  ]);

app.listen(3000, "localhost", () => {
  console.log("Server listening on port 3000");
});
