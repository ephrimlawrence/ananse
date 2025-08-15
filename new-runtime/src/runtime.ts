import { WigalGateway } from "./gateway";
import { Session } from "./session";
import { BaseSessionCache } from "./session_cache/base_session_cache";
import { MemoryCache } from "./session_cache/memcache.session";
import { Request, Response } from "./types";

export class Runtime {
	#session: Session;
	#gateway: WigalGateway;
	#cache: BaseSessionCache;

	async processRequest(req: Request, resp: Response) {
		// TODO: retrieve gateway from config
		this.#gateway = new WigalGateway();
		this.#session = new Session(this.#gateway.requestHandler(req));

		// TODO: get cache type from config
		this.#cache = MemoryCache.getInstance();
		// use wigal for now
	}
}
