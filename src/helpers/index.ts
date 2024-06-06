import {
	BaseMenu,
	DynamicMenu,
	Menu,
	MenuAction,
	ValidationResponse,
} from "@src/menus";
import { State } from "@src/models";
import { FormInput } from "@src/types";
import { Request, Response } from "@src/types/request";
import { SupportedGateway } from "./constants";
import { menuType } from "./menu.helper";

export async function validateInput(opts: {
	state: State;
	menu?: Menu;
	formInput?: FormInput;
	request: Request;
	response: Response;
}): Promise<{ error: string | undefined; valid: boolean }> {
	const { state, menu, formInput: input, request, response } = opts;

	if (menu == null && input == null) {
		throw new Error("Either menu or input must be defined");
	}

	let resp: { error: string | undefined; valid: boolean } = {
			valid: true,
			error: undefined,
		},
		status: ValidationResponse = true;

	if (menu != null) {
		if (menuType(menu) == "class") {
			status = await (menu as unknown as BaseMenu).validate(state?.userData);
		} else {
			status = await (menu as DynamicMenu).validateInput(request, response);
		}
	}

	if (input != null) {
		if (input.validate == null) {
			status = true;
		} else if (typeof input.validate == "function") {
			status = await input.validate(request, response);
		} else {
			try {
				status = (input.validate as RegExp).test(state?.userData);
			} catch (error) {}
		}
	}

	if (typeof status == "string") {
		resp = { valid: false, error: status };
	} else if (typeof status == "boolean" && status == false) {
		resp = { valid: false, error: undefined };
	}

	return resp;
}

export async function buildUserResponse(opts: {
	menu: Menu | undefined;
	state: State;
	errorMessage: string | undefined;
	request: Request;
	response: Response;
	actions?: MenuAction[];
}) {
	const { menu, state, errorMessage, response, request } = opts;

	if (errorMessage != null) {
		return errorMessage;
	}

	// No message to display, end session
	if (menu == null && state.isEnd) {
		return "";
	}

	// TODO: build paginated response

	let message: string | undefined = undefined;
	if (menuType(menu!) == "class") {
		message = await (menu as unknown as BaseMenu).message();
	} else {
		message = await (menu as DynamicMenu).getMessage(request, response);
	}

	// If message is null, set it to empty string
	if (message == null) {
		message = "";
	}

	// Add actions to the message
	let actions: MenuAction[] | undefined = opts.actions;

	if (actions == null) {
		if (menuType(menu!) == "class") {
			actions = (await (menu as unknown as BaseMenu).actions()) || [];
		} else {
			actions = await (menu as DynamicMenu).getActions();
		}
	}

	for await (const action of actions) {
		if (action.display == null) continue;

		if (typeof action.display == "function") {
			message += "\n" + (await action.display(this.request, this.response));
		} else {
			message += "\n" + action.display || "";
		}
	}

	return message;
}

export { SupportedGateway };
export { getMenuActions, menuType } from "./menu.helper";
