import router from "../../../../../src/menus";
import { MenuType } from "../../enums";
import { Customer } from "../../models/customer";
import { ClientLogin } from "./login.customer";

// Account login
router.add(ClientLogin, MenuType.customer_login);

// Client main menu
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
      next_menu: MenuType.customer_premium_payment,
    },
    {
      choice: "3",
      display: "3. Collection Balance",
      next_menu: MenuType.customer_balance,
    },
    {
      choice: "4",
      display: "4. Set up Direct Debit",
      next_menu: MenuType.customer_debit_setup,
    },
    {
      choice: "5",
      display: "5. Claims Request",
      next_menu: MenuType.customer_claim_request,
    },
    {
      choice: "6",
      display: "6. Reset Pin",
      next_menu: MenuType.customer_reset_pin,
    },
  ]);

// New customer registration, using forms feature
router
  .menu(MenuType.customer_registration) // menu name becomes form name
  .isForm()
  .inputs([
    {
      name: "first_name",
      validate: /[\w\s]{2,}/,
      display: "Enter first name",
      next_input: "last_name",
    },
    {
      name: "last_name",
      validate: /.*/,
      display: "Enter last name",
      next_input: "age",
    },
    {
      name: "age",
      validate: /\d{1,2}/,
      display: "Enter age (minium 18)",
      next_input: "pin",
    },
    {
      name: "pin",
      validate: /\d{4}/,
      display: "Enter PIN",
      handler: async (_req, session) => {
        //TODO: add session to request object
        const form = await session.get(MenuType.customer_registration);
        const customer = new Customer({
          first_name: form.first_name,
          phone_number: _req.state.msisdn,
          last_name: form.last_name,
          age: form.age,
          pin: form.pin, // !NOTE: Should be hashed with tools like bcrypt
        });
        await customer.save();
      },
      end: true, // Ends the form, and navigates to next menu
      next_menu: "client_created",
    },
  ]);

router
  .menu("client_created")
  .message(
    "Thank you for registering as customer with Star M Kindly dial short code again to register a policy"
  );

import "./new_policy.customer";
import "./pay_policy.customer";
