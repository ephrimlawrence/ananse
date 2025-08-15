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

	// TODO: add config singleton insance
	request() {
		return this.#request;
	}

	session() {
		return this.#session;
	}

	cache() {
		return this.#cache;
	}

	async processRequest(req: Request, resp: Response) {
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
		return this;
	}
}
