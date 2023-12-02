import { State } from "@src/models/ussd-state";
import { Session } from "./index.session";

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

  set(key: string, value: any): Session {
    this.data[key] = value;
    return this;
  }

  get<T = unknown>(key: string, defaultValue: T): unknown {
    return this.data[key] || defaultValue;
  }
}
