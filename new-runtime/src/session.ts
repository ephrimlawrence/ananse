import { GatewayData, SessionMode } from "./types";

export class Session {
	#mode: SessionMode = SessionMode.start;

	// #nextMenu: string | undefined = undefined;
	// #menuStack: string[] = [];

	constructor(private readonly gatewayData: GatewayData) {
		this.#mode = gatewayData.mode;
	}

	// __setNextMenu(value: string) {
	// 	this.#menuStack.unshift(value);
	// 	// this.#nextMenu = value;
	// }

	// getCurrentMenu() {
	// 	return this.#menuStack[0];
	// }

	mode(): SessionMode {
		return this.#mode;
	}

	phone(): string {
		return this.gatewayData.phone;
	}

	sessionId(): string {
		return this.gatewayData.sessionId;
	}

	end() {
		this.#mode = SessionMode.end;
	}

	userData(): string | null {
		return this.gatewayData.userData;
	}

	toJSON() {
		return {
			mode: this.#mode,
			phone: this.phone(),
			sessionId: this.sessionId(),
			gatewayData: this.gatewayData,
			// menuStack: this.#menuStack,
		};
	}
}
