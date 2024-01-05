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
    },
    {
      choice: "2",
      display: "2. Sales Executive",
      next_menu: MenuType.sales_executive,
    },
  ]);

// Account login
router.add(AccountLogin, MenuType.account_login);

// Client menus
router
  .menu(MenuType.customer)
  .message("Welcome to Star MicroInsurance. Choose an Option")
  .actions([
    {
      choice: "1",
      display: "1. New Policy Registration",
      next_menu: MenuType.customer_new_policy,
    },
    {
      choice: "2",
      display: "2. Pay Policy Premium",
      next_menu: MenuType.client_premium_payment,
    },

    {
      choice: "3",
      display: "3. Collection Balance",
      next_menu: MenuType.client_balance,
    },
    {
      choice: "4",
      display: "4. Set up Direct Debit",
      next_menu: MenuType.client_debit_setup,
    },
    {
      choice: "5",
      display: "5. Claims Request",
      next_menu: MenuType.client_claim_request,
    },
    {
      choice: "6",
      display: "6. Reset Pin",
      next_menu: MenuType.client_reset_pin,
    },
  ]);

// New policy registration
// router.menu(MenuType.customer_new_policy)
// .isForm("sign_up")
// .actions([
//   {
//     name: 'ssss',
//     choice: /\w{1,}/,
//     display: "Please Enter Name",
//     handler: async (req, session) => {
//       session.set("name", req.input);
//       return MenuType.customer_new_policy;
//     },
//     next_menu: MenuType.customer_new_policy,
//     next_input: "ssss2", // next input to be displayed
//   },
// ]);

// New policy registration
router
  .menu(MenuType.customer_new_policy) // menu name becomes form name
  .isForm()
  .inputs([
    {
      name: "first_name",
      validate: /.*/,
      // choice: /\w{1,}/,
      display: "Please Enter Name",
      handler: async (req, session) => {
        session.set("name", req.input); //TODO: add session to request object
        // return MenuType.customer_new_policy;
      },
      // next_input: string/function(req,response), // next input to be displayed
    },
    // {
    //   name: 'Please enter date of birth name',
    //   validate: Regex/function,
    //   // choice: /\w{1,}/,
    //   display: "Please Enter Name",
    //   handler: async (req, session) => {
    //     session.set("name", req.input); //TODO: add session to request object
    //     return MenuType.customer_new_policy;
    //   },
    //   next_input: string/function(req,response), // next input to be displayed
    //   end?: boolean/function(req),
    // },
  ]);

app.listen(3000, "localhost", () => {
  console.log("Server listening on port 3000");
});
