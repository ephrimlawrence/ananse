import { State } from "@src/models";
import { BaseSession } from "./base.session";

export class MemcacheSession extends BaseSession {
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

  async setState(id: string, state: State): Promise<State> {
    this.states[id] = state;
    return state;
  }

  async getState(id: string): Promise<State | undefined> {
    return this.states[id];
  }

  clear(id: string): State {
    const _state = this.states[id];
    delete this.states[id];
    delete this.data[id];
    return _state;
  }

  async set(sessionId: string, key: string, value: any) {
    if (this.data[sessionId] == null) {
      this.data[sessionId] = {};
    }

    this.data[sessionId][key] = value;
  }

  async remove(sessionId: string, key: string) {
    this.data[sessionId] ??= {};
    delete this.data[sessionId][key]
  }

  async get<T = unknown>(
    sessionId: string,
    key: string,
    defaultValue?: T,
  ): Promise<T | undefined> {
    if (this.data[sessionId] == null) {
      return defaultValue;
    }

    return (this.data[sessionId][key] || defaultValue) as T;
  }

  async getAll<T>(sessionId: string): Promise<T | undefined> {
    return this.data[sessionId] as T;
  }
}
