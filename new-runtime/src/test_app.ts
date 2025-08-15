// This file is a conceptual improvement of the USSD runtime.
// The code within the 'GENERATED' section is what a compiler would produce.

const express = require("express");
const { randomUUID } = require("crypto");
const app = express();
const port = 3000;

// ==========================================================
// MOCK DATABASE & SESSION MANAGEMENT
// ==========================================================

// An in-memory Map to simulate a session database.
// In a real application, this would be Redis, Firestore, or a similar store.
const sessions = new Map();

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

// ==========================================================
// EXTERNAL ACTIONS
// This section simulates external functions that the USSD app can call.
// In a real application, these would be separate modules.
// ==========================================================

const actions = {
	/**
	 * Mock function to check if a PIN is valid.
	 * @param {string} pin The user's PIN.
	 * @returns {{ is_valid: boolean }}
	 */
	async checkPin(pin) {
		// In a real app, you would validate against a database.
		return { is_valid: pin === "1234" };
	},

	/**
	 * Mock function to fetch account balance.
	 * @returns {{ amount: string, last_transaction_date: string }}
	 */
	async fetchBalance() {
		return {
			amount: "500.00",
			last_transaction_date: "2025-08-15",
		};
	},
};

// ==========================================================
// GENERATED MENU LOGIC
// This is the core of your USSD application, generated from the
// USSD language's AST.
// ==========================================================

/**
 * The core menu handler. It processes a request for a specific menu
 * by executing the generated logic for that menu.
 * @param {object} session - The session object containing current state.
 * @param {string} input - The user's raw input string.
 * @returns {{ message?: string, nextMenu?: string, endSession?: boolean, error?: string }}
 */
async function handleMenu(session, input) {
	// Use a string to build the message, handling multiple display statements
	let message = "";

	// The state machine for menu navigation, driven by the current menu name.
	switch (session.currentMenu) {
		case "Welcome":
			// From: menu Welcome
			// From: display "Welcome to USSD Banking. Please select an option:";
			message += "Welcome to USSD Banking. Please select an option:";
			// From: option "1" "Check Balance" -> PinCheck;
			message += "\n1. Check Balance";
			// From: option "2" "Exit" -> end;
			message += "\n2. Exit";

			// The `nextMenu` value for the Welcome menu
			return {
				message: message,
				nextMenu: "Welcome",
				endSession: false,
			};

		case "PinCheck":
			// From: menu PinCheck
			// From: display "Please enter your 4-digit PIN:";
			message += "Please enter your 4-digit PIN:";

			return {
				message: message,
				nextMenu: "PinCheck",
				endSession: false,
			};

		case "VerifyPin":
			// This menu is a transition for logic after the user submits input.
			// From: input user_pin;
			session.user_pin = input;

			// From: action checkPin with { pin = user_pin } as pin_status;
			session.pin_status = await actions.checkPin(session.user_pin);

			// From: if (pin_status.is_valid) { ... } else { ... }
			if (session.pin_status.is_valid) {
				// From: goto BalanceMenu;
				return {
					nextMenu: "BalanceMenu",
				};
			} else {
				// From: display "Invalid PIN. Please try again.";
				return {
					message: "Invalid PIN. Please try again.",
					nextMenu: "Welcome",
				};
			}

		case "BalanceMenu":
			// From: menu BalanceMenu
			// From: action fetchBalance as balance_info;
			session.balance_info = await actions.fetchBalance();

			// From: display "Your current balance is: GHS {{balance_info.amount}}";
			message += `Your current balance is: GHS ${session.balance_info.amount}`;
			// From: display "Last transaction: {{balance_info.last_transaction_date}}";
			message += `\nLast transaction: ${session.balance_info.last_transaction_date}`;
			// From: option "0" "Back" -> Welcome;
			message += "\n\n0. Back";
			// From: option "99" "End Session" -> end;
			message += "\n99. End Session";

			return {
				message: message,
				nextMenu: "BalanceMenu",
			};

		default:
			// Default case to handle unrecognized menus or an error state.
			return {
				message: "An error occurred. Please try again.",
				nextMenu: "Welcome",
			};
	}
}

/**
 * The main runtime loop that orchestrates the USSD session.
 * This is the common boilerplate that the compiler's output plugs into.
 * @param {object} req - The Express request object.
 * @returns {object} The complete response including new state.
 */
async function processRequest(req) {
	const { sessionId, input, nextMenu, isEnd } = req.query;

	// 1. Retrieve or create session from DB
	const sessionData = getSession(sessionId) || { currentMenu: "Welcome" };

	// Determine the next menu based on user input or a `goto` command
	let currentMenu;
	if (isEnd === "true" || input === "99") {
		currentMenu = "END";
	} else if (input === "0") {
		currentMenu = "Welcome";
	} else if (sessionData.currentMenu === "Welcome" && input === "1") {
		currentMenu = "PinCheck";
	} else if (sessionData.currentMenu === "PinCheck" && input !== null) {
		currentMenu = "VerifyPin";
	} else {
		currentMenu = sessionData.currentMenu;
	}

	sessionData.currentMenu = currentMenu;

	// 2. Run menu logic
	let menuResponse = await handleMenu(sessionData, input);

	// Handle transitions based on the response from the generated code.
	if (menuResponse.nextMenu) {
		sessionData.currentMenu = menuResponse.nextMenu;
	}

	// Handle the end session flag
	if (menuResponse.endSession || sessionData.currentMenu === "END") {
		sessionData.endSession = true;
		menuResponse.message = "Thank you for using our service. Session ended.";
	}

	// 3. Update history and save session state
	if (!sessionData.history) {
		sessionData.history = [];
	}
	sessionData.history.push({ menu: sessionData.currentMenu, input });
	saveSession(sessionId, sessionData);

	// 4. Return response
	return {
		sessionId,
		message: menuResponse.message,
		nextMenu: sessionData.currentMenu,
		endSession: sessionData.endSession || false,
		sessionState: sessionData,
	};
}

// ==========================================================
// EXPRESS SERVER & REQUEST HANDLER
// ==========================================================

// The main server route to handle all USSD requests.
app.get("/", async (req, res) => {
	const { sessionId } = req.query;
	const newSessionId = sessionId || randomUUID();

	try {
		const response = await processRequest({
			query: { ...req.query, sessionId: newSessionId },
		});

		res.json(response);
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
