import router from "../../../../../src/menus";
import { MenuType } from "../../enums";
import { Policy } from "../../models/policy";

// New policy registration, using forms feature
router
  .menu(MenuType.customer_new_policy) // menu name becomes form name
  .isForm()
  .inputs([
    {
      name: "product",
      display:
        "Please select product" +
        "\n1. Investment Funeral Policy" +
        "\n2. Child lifeline (Mma Anidaso)" +
        "\n3. Enhanced Abusua Nkyemfa" +
        "\n4. Micro Health Policy",
      next_input: "premium",
      validate: (req, _res) => {
        if (["1", "2", "3", "4"].includes(req.state.userData.toString())) {
          return true;
        }
        return false;
      },
    },
    {
      name: "premium",
      display:
        "Selecting Product 1, 2 and 3." +
        "\nChoose Your Monthly Premium" +
        "\n1. GHS50.00" +
        "\n2. GHS100.00" +
        "\n3. GHS150.00" +
        "\n4. GHS200.00" +
        "\n5. GHS250.00" +
        "\n6. GHS300.00" +
        "\n7. Enter your preferred amount in multiples of 50.00",
      next_menu: "policy_created",
      validate: (req, _res) => {
        if (
          ["1", "2", "3", "4", "5", "6", "7"].includes(
            req.state.userData.toString()
          )
        ) {
          return true;
        }
        return false;
      },
      handler: async (req, session) => {
        const form = await session.get(MenuType.customer_new_policy);
        const policy = new Policy({
          createdAt: new Date(),
          name: form.product,
          premium: +form.premium * 100, // Dummy premium amount
          customer: await session.get("customer"),
        });
        await policy.save();
        // TODO: what if the user wants to show error message/terminate session?
      },
    },
  ]);

router
  .menu("policy_created")
  .message(
    "Thank you for registering with star MicroInsurance Services Limited, you will receive your policy number via SMS"
  );
