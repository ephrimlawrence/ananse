import { GatewayData, SessionMode } from "./types";

export class Session {
	// #nextMenu: string | undefined = undefined;
	#menuStack: string[] = [];

	constructor(private readonly gatewayData: GatewayData) {}

	__setNextMenu(value: string) {
		this.#menuStack.unshift(value);
		// this.#nextMenu = value;
	}

	getNextMenu() {
		return this.#menuStack[0];
	}

	mode(): SessionMode {
		return this.gatewayData.mode;
	}

	phone(): string {
		return this.gatewayData.phone;
	}

	sessionId(): string {
		return this.gatewayData.sessionId;
	}

	toJson() {
		return {
			mode: this.mode,
			phone: this.phone,
			sessionId: this.sessionId,
			gatewayData: this.gatewayData,
			menuStack: this.#menuStack,
		};
	}
}
