import { Request, MenuRouter, ValidationResponse } from "../../../../../src";
import { MenuType } from "../../enums";
import { Payment } from "../../models/payment";
import { Policy } from "../../models/policy";

// New policy registration, using forms feature
MenuRouter.menu(MenuType.customer_premium_payment) // menu name becomes form name
	.isForm()
	.inputs([
		{
			name: "policy",
			next_input: "amount",
			display: async (req: Request) => {
				const policies = await Policy.find({
					customer: await req.session.get("customer"),
				});

				return policies
					.map((policy, index) => `${index + 1}. ${policy.name}`)
					.join("\n");
			},
			validate: async (req, _res): Promise<ValidationResponse> => {
				if (isNaN(+req.state.userData)) {
					return false;
				}

				const policies = await Policy.find({
					customer: await req.session.get("customer"),
				});

				return +req.state.userData >= policies.length;
			},
			handler: async (req: Request, session) => {
				const form: Record<string, any> = (await req.session.get(
					MenuType.customer_premium_payment,
				))!;
				const policies = await Policy.find({
					customer: await req.session.get("customer"),
				});
				const policy = policies[+form.policy - 1];
				await session.set("policy", policy._id.toString());
			},
		},
		{
			name: "amount",
			display: "Please Enter Amount",
			next_menu: "payment_confirmed",
			validate: (req, _res) => {
				// Check if amount is a number
				if (isNaN(+req.state.userData)) {
					return "Invalid input. Enter amount";
				}
				return true;
			},
			handler: async (req: Request, session) => {
				const form = await session.get<any>(MenuType.customer_premium_payment);
				// TODO: add payment logic here. Any payment provider can be used, eg. hubtel, paystack, stripe, etc.

				const payment = new Payment({
					createdAt: new Date(),
					updatedAt: new Date(),
					policy: await session.get("policy"),
					amount: +form.amount,
				});
				await payment.save();
			},
		},
	]);

// TODO: add function to end session
MenuRouter.menu("payment_confirmed").message(
	"Your payment has been confirmed. Thank you for choosing Star Microinsurance",
);
