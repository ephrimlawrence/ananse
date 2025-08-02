import type { PaginationItem } from "@src/types/pagination.type";
import type { MenuAction } from "../menus";

export enum StateMode {
	start = "start",
	more = "more",
	end = "end",
}

export class State {
	sessionId: string;
	mode: StateMode;
	msisdn: string;
	userData: string;
	action?: MenuAction | undefined;
	previous?: State | undefined;
	form?:
		| {
				id: string;
				/**
				 * Tracks submitted inputs. Key is the input name, and value must be `true`.
				 * If an input is submitted, it is added to this object.
				 * If the input is revisited, it is first removed from this object and
				 * then added back when it is submitted again.
				 *
				 */
				submitted: Record<string, true>; // Can be array but a map for O(1) lookup
				nextInput: string | undefined;
				// TODO: track submitted inputs
		  }
		| undefined;

	/**
	 * Tracks visited menus/next to be visited menus.
	 */
	menu?:
		| {
				/**
				 * Tracks visited menus.
				 *
				 * Key is the menu name, and value must be `true`.
				 * If a menu is visited, it is added to this object. If the menu is to
				 * be revisited, it is first removed from this object and then added back
				 * after input validation.
				 *
				 */
				visited: Record<string, true>; // Can be array but a map for O(1) lookup
				nextMenu: string | undefined;
				// TODO: track submitted inputs
		  }
		| undefined;

	pagination: {
		[menuId: string]: {
			currentPage: PaginationItem | undefined;
			pages: PaginationItem[];
		};
	} = {};

	get isStart(): boolean {
		return this.mode == StateMode.start;
	}

	get isEnd(): boolean {
		return this.mode == StateMode.end;
	}

	/**
	 * Sets mode to "end"
	 */
	end(): void {
		this.mode = StateMode.end;
	}

	static fromJSON(json: Record<string, any>): State {
		return Object.assign(new State(), json);
	}

	toJSON(): Record<string, any> {
		return {
			sessionId: this.sessionId,
			mode: this.mode,
			msisdn: this.msisdn,
			userData: this.userData,
			// nextMenu: this.nextMenu,
			menu: this.menu,
			action: this.action,
			previous: this.previous?.toJSON(),
			// formInputId: this.formInputId,
			form: this.form,
			pagination: this.pagination,
		};
	}
}
