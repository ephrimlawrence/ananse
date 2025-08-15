// * determine gateway
// * retrieve session from db
// * determine the current menu
//      * session initiation?
//      * existing session?
//      * pagination?
// * run logic...
// * save session state
// * return response

import { Runtime } from "./runtime";
import { Request, Response, SessionMode } from "./types";

// An in-memory Map to simulate a session database.
// In a real application, this would be Redis, Firestore, or a similar store.
const sessions = new Map();
const menuStack: string[] = [];

/**
 * Saves a session state to the mock database.
 * @param {string} sessionId The unique session ID.
 * @param {object} sessionData The data to store for the session.
 */
function saveSession(sessionId, sessionData) {
	sessions.set(sessionId, sessionData);
}

/**
 * Retrieves a session state from the mock database.
 * @param {string} sessionId The unique session ID.
 * @returns {object | undefined} The session data or undefined if not found.
 */
function getSession(sessionId) {
	return sessions.get(sessionId);
}

function saveSession(request) {
	// TODO: save session to db/redis/memory/
}

// Menu api
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

	let message: string = "";
	let endSession: boolean = false;

	if (type === "get") {
		// process display text

		// process input
		request.session.set("variable_name", runtime.session().userData());

		// if options are defined
		// process options
		let options: {
			choice: string | RegExp;
			label: string;
			goto: string;
			action: string;
		}[] = [];
		for (const option in options) {
			message += option.label;
		}

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
		// if input is defined
		session.set("variable", input);
		const ___variable = input;

		// if options are defined
		// process options
		let options: {
			choice: string | RegExp;
			label: string;
			goto: string;
			action: string;
		}[] = [];
		let foundMatch: boolean = false;
		let selectedOption: string = null;

		for (const option of options) {
			if (!input_matches_choice({ input, choice })) {
				foundMatch = true;
				selectedOption = option.label;
			}
		}

		if (!foundMatch) {
			// re-render option
			return menu_name_function(runtime, request, session, "get");
		}

		// Repeat this for all options defined by the user
		if (selectedOption == "option_label") {
			let canNavigate: boolean = true;
			// if 'goto' & action is set, then 'goto' is called only if action returns 'true'

			// if 'goto' & 'action' is defined
			// canNavigate
			const actionResult = await actionName({ args });
			// for variable
			session.set("variable_name", actionResult);

			if (actionResult) {
				runtime.removeCurrentMenu(); // remove current menu from the stack

				// if goto is set
				await runtime.setNextMenu("next-menu_name_[GET]"); // push new menu to the stack
				await runtime.saveState();

				// for goto is set
				return next_menu_name(runtime, request, session, "get");
			}
		}

		// [START] goto
		// goto code here
		// if error message is set
		await runtime.setError("menu_name", "error-msg");

		// next menu
		await runtime.removeCurrentMenu(); // remove current menu from the stack
		runtime.setNextMenu("next-menu_name_[GET]"); // push new menu to the stack
		await runtime.saveState();

		// for goto is set
		return next_menu_name(runtime, request, session, "get");

		// return next_menu_name(request, session, "get");
		// [END]
		// run logic...

		// START: Session Termination
		await runtime.endSession();
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
		// case "menu_2":
		// 	return menu_name_function(request);
		// case "menu_3":
		// 	return menu_name_function();
		default:
			if (runtime.session().mode() === SessionMode.start) {
				menuStack.unshift("start_menu");

				return "start menu function(get)";
			}

			return "Session cannot be retrieved";
	}
}

export async function requestHandler(req: Request, resp: Response) {
	const runtime = await new Runtime().processRequest(req, resp);
	handleMenu(runtime);
	// get session
}
