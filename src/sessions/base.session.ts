import { State } from "@src/models";
import { SessionOptions } from "@src/types";

export abstract class BaseSession {
  protected readonly states: { [sessionId: string]: State } = {};
  protected readonly data: { [sessionId: string]: Record<string, any> } = {};

  // TODO: change this to a proper configuration based on the session type
  async configure(options?: SessionOptions): Promise<void> {
    // throw new Error("Method not implemented.");
  }

  abstract setState(id: string, state: State): Promise<State>;

  abstract getState(id: string): Promise<State | undefined>;

  abstract clear(id: string): void | State;

  // TODO: add delete for data

  abstract set(sessionId: string, key: string, value: any): Promise<void>;

  abstract get<T>(
    sessionId: string,
    key: string,
    defaultValue?: T,
  ): Promise<T | undefined>;

  abstract getAll<T = unknown>(sessionId: string): Promise<T | undefined>;
}
