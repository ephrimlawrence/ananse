import { GatewayData, SessionMode } from "./types";

export class Session {
	#nextMenu: string | undefined = undefined;

	constructor(private readonly gatewayData: GatewayData) {}

	setNextMenu(value: string) {
		this.#nextMenu = value;
	}

	getNextMenu() {
		return this.#nextMenu;
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
}
