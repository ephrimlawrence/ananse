// import { State } from "@src/models";
import { BaseSessionCache } from "./base_session_cache";

export class MemoryCache extends BaseSessionCache {
	private static instance: MemoryCache;

	private constructor() {
		super();
	}

	public static getInstance(): MemoryCache {
		if (!MemoryCache.instance) {
			MemoryCache.instance = new MemoryCache();
		}

		return MemoryCache.instance;
	}

	// async setState(id: string, state: State): Promise<State> {
	//   this.states[id] = state;
	//   return state;
	// }

	// async getState(id: string): Promise<State | undefined> {
	//   return this.states[id];
	// }

	// clear(id: string): State {
	//   const _state = this.states[id];
	//   delete this.states[id];
	//   delete this.data[id];
	//   return _state;
	// }

	async set(sessionId: string, key: string, value: any) {
		if (this.data[sessionId] == null) {
			this.data[sessionId] = {};
		}

		this.data[sessionId][key] = value;
	}

	async remove(sessionId: string, key: string) {
		this.data[sessionId] ??= {};
		delete this.data[sessionId][key];
	}

	async get<T = unknown>(
		sessionId: string,
		key: string,
		defaultValue?: T,
	): Promise<T> {
		return (this.data[sessionId][key] || defaultValue) as T;
	}

	async getAll<T>(sessionId: string): Promise<T> {
		return this.data[sessionId] as T;
	}
}
