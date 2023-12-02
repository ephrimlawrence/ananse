import { State } from "@src/models/ussd-state";

export abstract class Session {
  protected readonly states: { [sessionId: string]: State } = {};
  protected readonly data: { [sessionId: string]: Record<string, any> } = {};

  // TODO: change this to a proper configuration based on the session type
  async configure(options?: SessionOptions): Promise<void> {
    throw new Error("Method not implemented.");
  }

  abstract setState(id: string, state: State): State;

  abstract getState(id: string): State | undefined;

  abstract removeState(id: string): void | State;

  abstract set(sessionId: string, key: string, value: any): Promise<void>;

  abstract get<T = unknown>(
    sessionId: string,
    key: string,
    defaultValue?: T
  ): T | unknown;

  abstract getAll<T = unknown>(sessionId: string): T | unknown;
}

export interface SessionOptions {
  type: "redis" | "mongo" | "postgres";
  keyPrefix?: string;
  host?: string | undefined;
  port?: number | undefined;
  url?: string;
  username?: string | undefined;
  password?: string | undefined;
  database?: string | number | undefined;
}
