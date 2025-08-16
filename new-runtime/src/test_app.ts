// * determine gateway
// * retrieve session from db
// * determine the current menu
//      * session initiation?
//      * existing session?
//      * pagination?
// * run logic...
// * save session state
// * return response
const express = require("express");
const { randomUUID } = require("crypto");
const app = express();
const port = 3000;

import { Runtime } from "./runtime";
import { Request, Response, SessionMode } from "./types";

// An in-memory Map to simulate a session database.
// In a real application, this would be Redis, Firestore, or a similar store.
const menuStack: string[] = [];

// Menu api
async function test_menu_function(
	runtime: Runtime,
	// request,
	// session,
	type: "get" | "post",
) {
	const menuName = "<menu-name-here>";
	const errorMessage: string | undefined = await runtime.getError(menuName);

	if (errorMessage != null) {
		// Add menu name back to stack
		if (runtime.getCurrentMenu() !== menuName) {
			runtime.setNextMenu(`${menuName}_[GET]`);
		}

		await runtime.clearError(menuName);
		return errorMessage;
	}

	// let endSession: boolean = false;

	if (type === "get") {
		let message: string = "Hi there";
		await runtime.saveState();

		// return string or end session
		// TODO: build_pagination
		return runtime.respond(message);
	}

	const input: string | null = runtime.session().userData();

	if (type === "post") {
		runtime.endSession();
		runtime.respond("Me now");
	}
}

async function menu_name_function(
	runtime: Runtime,
	// request,
	// session,
	type: "get" | "post",
) {
	// type -> 'get': only execute logic neccary to display menu text
	// type -> 'post': execute main logic and return next menu (with get request)
	const menuName = "<menu-name-here>";

	const errorMessage: string | undefined = await runtime.getError(menuName);

	if (errorMessage != null) {
		// Add menu name back to stack
		if (runtime.getCurrentMenu() !== menuName) {
			runtime.setNextMenu(`${menuName}_[GET]`);
		}

		await runtime.clearError(menuName);
		return errorMessage;
	}

	// let endSession: boolean = false;

	if (type === "get") {
		let message: string = "In get handler. \n Enter 1";
		// process display text

		// NOTE: input, end, goto, option (goto & actions) are not executed in get request
		// process input
		// request.session.set("variable_name", runtime.session().userData());

		// if options are defined
		// process options
		// let options: {
		// 	choice: string | RegExp;
		// 	label: string;
		// 	goto: string;
		// 	action: string;
		// }[] = [];
		// for (const option in options) {
		// 	message += option.label;
		// }

		// Adds item name
		// if (menuStack[0] != "this_menu_name") {
		// 	menuStack.unshift("this_menu_name");
		// }

		// run logic
		await runtime.saveState();

		// return string or end session
		// TODO: build_pagination
		return runtime.respond(message);
	}

	const input: string | null = runtime.session().userData();

	if (type === "post") {
		console.log("user data", input);
		if (input === "1") {
			await runtime.removeCurrentMenu(); // remove current menu from the stack
			runtime.setNextMenu("test_menu_[GET]"); // push new menu to the stack
			await runtime.saveState();
			return test_menu_function(runtime, "get");
		}

		runtime.endSession();
		runtime.respond("In Post handler");
		// if input is defined
		// runtime.setValue("variable-name", input);
		// const ___variable = input;

		// // if options are defined
		// // process options
		// let options: {
		// 	choice: string | RegExp;
		// 	label: string;
		// 	goto: string;
		// 	action: string;
		// }[] = [];
		// let foundMatch: boolean = false;
		// let selectedOption: string = null;

		// for (const option of options) {
		// 	if (!input_matches_choice({ input, choice })) {
		// 		foundMatch = true;
		// 		selectedOption = option.label;
		// 	}
		// }

		// if (!foundMatch) {
		// 	// re-render option
		// 	return menu_name_function(runtime, "get");
		// }

		// // Repeat this for all options defined by the user
		// if (selectedOption == "option_label") {
		// 	let canNavigate: boolean = true;
		// 	// if 'goto' & action is set, then 'goto' is called only if action returns 'true'

		// 	// if 'goto' & 'action' is defined
		// 	// canNavigate
		// 	const actionResult = await actionName({ args });
		// 	// for variable
		// 	await runtime.setValue("variable_name", actionResult);

		// 	if (actionResult) {
		// 		runtime.removeCurrentMenu(); // remove current menu from the stack

		// 		// if goto is set
		// 		await runtime.setNextMenu("next-menu_name_[GET]"); // push new menu to the stack
		// 		await runtime.saveState();

		// 		// for goto is set
		// 		return next_menu_name(runtime, "get");
		// 	}
		// }

		// // [START] goto
		// // goto code here
		// // if error message is set
		// await runtime.setError("menu_name", "error-msg");

		// // next menu
		// await runtime.removeCurrentMenu(); // remove current menu from the stack
		// runtime.setNextMenu("next-menu_name_[GET]"); // push new menu to the stack
		// await runtime.saveState();

		// // for goto is set
		// return next_menu_name(runtime, request, session, "get");

		// // return next_menu_name(request, session, "get");
		// // [END]
		// // run logic...

		// // START: Session Termination
		// await runtime.endSession();
		// END: Session Termination
		// return next menu or end session
		// return next_menu_function(request, "get");
	}
}

// Sample 1
function handleMenu(runtime: Runtime) {
	const currentMenu: string | undefined = runtime.getCurrentMenu();

	switch (currentMenu) {
		case "menu_name_[GET]":
			return menu_name_function(runtime, "get");
		case "menu_name_[POST]":
			return menu_name_function(runtime, "post");
		case "test_menu_[GET]":
			return test_menu_function(runtime, "post");
		// case "menu_2":
		// 	return menu_name_function(request);
		// case "menu_3":
		// 	return menu_name_function();
		default:
			console.log("here");
			if (runtime.session().mode() === SessionMode.start) {
				runtime.setNextMenu("menu_name_[POST]");

				return menu_name_function(runtime, "get");
			}

			runtime.endSession();
			runtime.respond("Session cannot be retrieved");
	}
}

export async function requestHandler(req: Request, resp: Response) {
	const runtime = await new Runtime(req, resp);
	await runtime.loadState();
	handleMenu(runtime);
	// get session
}

// The main server route to handle all USSD requests.
app.get("/", async (req, res) => {
	// Determine gateway and retrieve/create session
	const { sessionId, input, ...params } = req.query;

	// If no session ID is provided, this is a new session.
	const newSessionId = sessionId || randomUUID();

	// // Create a new request object to pass to the processor
	// const request = {
	//   query: {
	//     sessionId: newSessionId,
	//     input: input,
	//     ...params
	//   }
	// };

	try {
		await requestHandler(req, res);

		// The response is returned to the client in a JSON format for testing,
		// but in a real app, you would format it as a plain text USSD response.
		// res.json(response);
	} catch (error) {
		console.error("USSD processing failed:", error);
		res.status(500).json({ error: "An internal server error occurred." });
	}
});

// Start the server
app.listen(port, () => {
	console.log(`USSD simulator server listening on http://localhost:${port}`);
	console.log("---");
	console.log("To start a new session, visit:");
	console.log(`http://localhost:${port}/?sessionId=123&input=*714%23`);
	console.log("---");
	console.log("To continue a session, provide the sessionId:");
	console.log(`http://localhost:${port}/?sessionId=...&input=...`);
});
