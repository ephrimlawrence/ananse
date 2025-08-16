import { WigalGateway } from "./gateway";
import { Session } from "./session";
import { BaseSessionCache } from "./session_cache/base_session_cache";
import { MemoryCache } from "./session_cache/memcache.session";
import { Request, Response } from "./types";

export class Runtime {
	#session: Session;
	#gateway: WigalGateway;
	#cache: BaseSessionCache;
	#request: Request;
	#response: Response;
	#menuStack: string[] = [];

	// TODO: add config singleton insance

	// TODO: add load session
	constructor(req: Request, resp: Response) {
		this.#request = req;
		this.#response = resp;
		// TODO: retrieve gateway from config
		this.#gateway = new WigalGateway();
		this.#session = new Session(this.#gateway.requestHandler(req));

		// TODO: get cache type from config
		this.#cache = MemoryCache.getInstance();
		// use wigal for now

		// return {
		// 	session: new Session(this.#gateway.requestHandler(req)),
		// 	cache: MemoryCache.getInstance(),
		//   gateway: new WigalGateway(),
		//   request: req,
		//   response: resp
		// };
		// return this;
	}

	request() {
		return this.#request;
	}

	session() {
		return this.#session;
	}

	cache() {
		return this.#cache;
	}

	async getError(menuName: string) {
		return await this.#cache.get<string>(
			this.#session.sessionId(),
			`${menuName}__error`,
		);
	}

	async setError(menuName: string, msg: string) {
		return await this.#cache.set(
			this.#session.sessionId(),
			`__${menuName}__error`,
			msg,
		);
	}

	async setValue(key: string, value: any) {
		return await this.#cache.set(this.#session.sessionId(), key, value);
	}

	async getValue(key: string) {
		return await this.#cache.get(this.#session.sessionId(), key);
	}

	async clearError(menuName: string) {
		return await this.#cache.remove(
			this.#session.sessionId(),
			`__${menuName}__error`,
		);
	}

	getCurrentMenu() {
		return this.#menuStack[0];
	}

	async removeCurrentMenu() {
		this.#menuStack.shift();
	}

	async setNextMenu(name: string) {
		this.#menuStack.unshift(name);

		return await this.#cache.set(
			this.#session.sessionId(),
			`__next_menu`,
			name,
		);
	}

	async saveState() {
		await this.#cache.set(
			this.#session.sessionId(),
			"__session_state",
			this.toJSON(),
		);
	}

	async loadState() {
		const data: Record<string, any> = await this.#cache.get(
			this.#session.sessionId(),
			"__session_state",
			{},
		);
		this.#menuStack = data.menuStack ?? [];
	}

	async endSession() {
		this.#session.end();
	}

	respond(message: string) {
		this.#gateway.responseHandler(
			this.#request,
			this.#response,
			this.#session,
			message,
			this.#menuStack[0],
		);
	}

	toJSON() {
		return {
			menuStack: this.#menuStack,
			session: this.#session.toJSON(),
		};
	}
}
