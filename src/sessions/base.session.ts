import { State } from "@src/models/ussd-state";

export abstract class Session {
  protected readonly states: { [key: string]: State } = {};
  protected readonly data: { [key: string]: any } = {};

  // TODO: change this to a proper configuration based on the session type
  async configure(options?: SessionOptions): Promise<void> {
    throw new Error("Method not implemented.");
  }

  abstract setState(id: string, state: State): State;

  abstract getState(id: string): State | undefined;

  abstract removeState(id: string): void | State;

  abstract set(key: string, value: any): Session;

  abstract get<T = unknown>(key: string, defaultValue: T): T | unknown;
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
