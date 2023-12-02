import { State } from "@src/models/ussd-state";
import { Session } from "./base.session";

export class MemcacheSession extends Session {
  private static instance: MemcacheSession;

  private constructor() {
    super();
  }

  public static getInstance(): MemcacheSession {
    if (!MemcacheSession.instance) {
      MemcacheSession.instance = new MemcacheSession();
    }

    return MemcacheSession.instance;
  }

  setState(id: string, state: State) {
    this.states[id] = state;
    return state;
  }

  getState(id: string): State | undefined {
    return this.states[id];
  }

  removeState(id: string): void | State {
    const _state = this.states[id];
    delete this.states[id];
    return _state;
  }

  set(sessionId: string, key: string, value: any): Session {
    if (this.data[sessionId] == null) {
      this.data[sessionId] = {};
    }

    this.data[sessionId][key] = value;
    return this;
  }

  get<T = unknown>(sessionId: string, key: string, defaultValue: T): unknown {
    if (this.data[sessionId] == null) {
      return defaultValue;
    }

    return this.data[sessionId][key] || defaultValue;
  }
}
