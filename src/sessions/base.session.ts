import { State } from "@src/models";

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

export type SessionOptions = RedisSessionOptions | SQLSessionOptions;

interface BaseSessionOptions {
  host?: string | undefined;
  port?: number | undefined;
  url?: string;
  username?: string | undefined;
  password?: string | undefined;
  database?: string | number | undefined;
}

export interface SQLSessionOptions extends BaseSessionOptions {
  type: "postgres" | "mysql" | "mssql";

  /**
   * The name of the table to use for the session, default is `ussd_sessions`
   */
  tableName?: string;

  /**
   * The schema to use for the session table, default is `public`
   */
  schema?: string;

  /**
   * The name of the database to use
   */
  database: string;

  /**
   * Whether to use soft delete or not, default is `false`.
   *
   * If set to `true`, the session will not be deleted from the database,
   * but will be marked as deleted by setting the `deleted_at` column to the current date and time.
   */
  softDelete?: boolean;
}

export interface RedisSessionOptions extends BaseSessionOptions {
  type: "redis";
  keyPrefix?: string;
}
