import {
	Ananse,
	WigalGateway,
	BaseMenu,
	Request,
	Response,
	MenuRouter,
} from "../src";

class SelfService extends BaseMenu {
	async nextMenu() {
		// console.log(this.session.get("account_number"));
		return undefined;
	}

	async message() {
		this.session.set("account_number", "1234567890");

		// console.log(this.session.getAll());

		return "Self Service";
	}

	async actions() {
		return [
			{
				choice: "1",
				display: "1. Change PIN",
				// validation: /regex/,
				name: "change_pin",
			},
			{
				choice: "2",
				display: "2. Change Account Info",
				next_menu: "self_service.change_account_info",
				name: "self_service.change_account_info",
			},
			{
				choice: "3",
				display: "3. Close Account",
				next_menu: "self_service.close_account",
			},
		];
	}
}
class CloseAccount extends BaseMenu {
	async nextMenu() {
		return undefined;
	}

	async message() {
		console.log(await this.session.get("account_number"));
		return "Are you sure you want to close your account?";
	}

	async actions() {
		return [
			{
				choice: "1",
				display: "1. No",
				name: "no",
			},
			{
				choice: "2",
				display: "2. Yes",
				name: "self_service.close_account.confirmed",
			},
		];
	}
}

const app = new Ananse().configure({
	gateway: "wigal",
	middlewares: [WigalGateway],
	session: { type: "redis" },
});

MenuRouter.menu("first")
	.start()
	.message("Hello, welcome to FirstTrust Bank")
	.actions([
		{
			choice: "1",
			display: "1. Check Balance",
			// name: "check_balance",
			next_menu: "check_balance",
		},
		{
			choice: "2",
			display: (_req: Request, _res: Response) => {
				return "2. Investment";
			},
			// name: "investment",
		},
		{
			choice: "3",
			display: "3. Self Service",
			next_menu: "self_service",
			// name: "self_service",
		},
	]);

MenuRouter.menu("check_balance")
	.message("Enter your account PIN")
	.defaultNextMenu("verify_pin");

MenuRouter.menu("verify_pin")
	.validation(/\d{4}/)
	.message("Your account balance is GHS12.000");
// TODO: add .end() function

MenuRouter.add(SelfService, "self_service");
MenuRouter.add(CloseAccount, "self_service.close_account");

// console.log(JSON.stringify(router, null, 2));

// app.listen(3000, "localhost", () => {
//   console.log("Server listening on port 3000");
// });

export default app;
