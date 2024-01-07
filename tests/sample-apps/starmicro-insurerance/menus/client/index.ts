import router from "../../../../../src/menus";
import { MenuType } from "../../enums";

// New policy registration, using forms feature
router
  .menu(MenuType.customer_new_policy) // menu name becomes form name
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
      handler: async (req, session) => {
        //TODO: add session to request object
        const form = await session.get(MenuType.customer_new_policy);
        console.log(form); // Save form to database
      },
      end: true, // Ends the form, and navigates to next menu
      next_menu: "policy_created",
    },
  ]);

router
  .menu("policy_created")
  .message(
    "Thank you for registering as customer with Star M Kindly dial short code again to register a policy"
  );
