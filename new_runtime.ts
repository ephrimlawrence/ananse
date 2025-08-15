// * determine gateway
// * retrieve session from db
// * determine the current menu
//      * session initiation?
//      * existing session?
//      * pagination?
// * run logic...
// * save session state
// * return response

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
function menu_name_function(request, session, type: "get" | "post") {
	// type -> 'get': only execute logic neccary to display menu text
	// type -> 'post': execute main logic and return next menu (with get request)
  let endSession: boolean = false;
  let input: string = request.input;
  let message: string = "";
  const errorMessage: string? = session.menu_error("menu_name");

  if(errorMessage != null){
      // Add menu name back to stack
    if(menuStack[0] != "this_menu_name"){
      menuStack.unshift("this_menu_name");
    }

    session.clear_error("menu_name");
    return errorMessage;
  }

  if (type === "get") {
		// process display text

    // process input
    request.session.set("variable_name", request.input);

    // if options are defined
    // process options
    let options: {choice: string|RegExp, label: string, goto: string, action: string}[] = []
    for(const option in options){
      message += option.label;
    }

    // Adds item name
    if(menuStack[0] != "this_menu_name"){
      menuStack.unshift("this_menu_name");
    }

    // run logic
		saveSession();

		// return string or end session
    // TODO: build_pagination
		return message;
	}

	if (type === "post") {
    // if input is defined
    session.set('variable', input);
    const ___variable = input;

    // if options are defined
    // process options
    let options: {choice: string|RegExp, label: string, goto: string, action: string}[] = []
    let foundMatch: boolean = false;
    let selectedOption: string = null;

    for(const option of options){
      if(!input_matches_choice({input, choice})){
        foundMatch = true;
        selectedOption = option.label;
      }
    }

    if(!foundMatch){
      // re-render option
      return menu_name_function(request, session, "get");
    }

    // Repeat this for all options defined by the user
    if(selectedOption == "option_label"){
      let canNavigate: boolean = true;
      // if 'goto' & action is set, then 'goto' is called only if action returns 'true'

      // if 'goto' & 'action' is defined
      // canNavigate
      const actionResult = await actionName({args});
      // for variable
      session.set('variable_name', actionResult);

      if(actionResult){
        menuStack.shift(); // remove current menu from the stack
        menuStack.unshift("next-menu_name"); // push new menu to the stack
        saveSession();

        // for goto is set
        return next_menu_name(request, session, "get");
      }
    }

    // [START] goto
    // goto code here
    // if error message is set
    session.set_menu_error('menu_name', 'error-msg');

    // next menu
    menuStack.shift(); // remove current menu from the stack
    menuStack.unshift("next-menu_name"); // push new menu to the stack
    saveSession();

    return next_menu_name(request, session, "get");
    // [END]
		// run logic...

		// return next menu or end session
		// return next_menu_function(request, "get");
	}
}

// Sample 1
function handleMenu(request) {
	switch ("menu_from_session") {
		case "start":
			if (menuStack[0] == null) {
        menuStack.unshift("this-menu-name");
				return menu_name_function(request, "get");
			} else if (menuStack[0] == "this-menu-name") {
				// replace with menu name
				return menu_name_function(request, "post");
			}
			break;
		case "menu_1":
			return menu_name_function(request);
		case "menu_2":
			return menu_name_function();
		default:
			return "Session cannot be retrieved";
	}
}


export function requestHandler(req, resp){
  // get session
}
