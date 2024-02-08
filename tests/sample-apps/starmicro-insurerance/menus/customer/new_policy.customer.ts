import { Request, MenuRouter } from "../../../../../src";
import { MenuType } from "../../enums";
import { Policy } from "../../models/policy";

const PRODUCTS = [
  "Investment Funeral Policy",
  "Child lifeline (Mma Anidaso)",
  "Enhanced Abusua Nkyemfa",
  "Micro Health Policy",
];

// New policy registration, using forms feature
MenuRouter
  .menu(MenuType.customer_new_policy) // menu name is used as the form name
  .isForm()
  .inputs([
    {
      name: "product",
      display: (_req: Request) => {
        return PRODUCTS.map(
          (product, index) => `${index + 1}. ${product}`
        ).join("\n");
      },
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
      handler: async (req: Request) => {
        const form = await req.session.get<Record<string, any>>(
          MenuType.customer_new_policy
        );
        const policy = new Policy({
          createdAt: new Date(),
          name: PRODUCTS[+form!.product - 1],
          premium: +form!.premium * 100, // Dummy premium amount
          customer: await req.session.get("customer"),
        });
        await policy.save();
        // TODO: what if the user wants to show error message/terminate session?
      },
    },
  ]);

MenuRouter
  .menu("policy_created")
  .message(
    "Thank you for registering with star MicroInsurance Services Limited, you will receive your policy number via SMS"
  );
