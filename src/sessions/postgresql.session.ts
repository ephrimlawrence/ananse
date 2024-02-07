import { State } from "@src/models/ussd-state";
import { BaseSession, PostgresSessionOptions } from "./base.session";

export class PostgresSession extends BaseSession {
  private static instance: PostgresSession;

  private config: PostgresSessionOptions;
  private db: any;

  private constructor() {
    super();
  }


  public static getInstance(): PostgresSession {
    if (!PostgresSession.instance) {
      PostgresSession.instance = new PostgresSession();
    }

    return PostgresSession.instance;
  }

  async configure(options: PostgresSessionOptions): Promise<void> {
    if (options == null) {
      throw new Error("Postgres session configuration is required!");
    }
    this.config = options;
    this.config.tableName ??= "ussd_sessions";

    let pgPromise;

    try {
      pgPromise = await import('pg-promise');
    } catch (error) {
      throw new Error("'pg-promise' module is required for postgres session. Please install it using 'npm install pg-promise' or 'yarn add pg-promise'")
    }

    const pgp = pgPromise.default({
      capSQL: true, // capitalize all generated SQL
      schema: [options?.schema || 'public'],
    });

    this.db = pgp({
      host: options?.host || "localhost",
      port: options?.port || 5432,
      database: options.database,
      user: options.username || 'postgres',
      password: options.password as any,
    });
  }

  private get softDeleteQuery() {
    if (this.config.softDelete == false || this.config.softDelete == null) return "";

    return "AND deleted_at IS NULL";
  }

  async setState(sessionId: string, state: State) {
    this.states[sessionId] = state;

    // Update the state in the database
    await this.db.none(
      `UPDATE $1~.$2~ SET state = $3::jsonb, updated_at = $4 WHERE session_id = $5 ${this.softDeleteQuery}`,
      [this.config.schema, this.config.tableName, JSON.stringify(state.toJSON()), sessionId, new Date().toISOString()]
    )
    return state;
  }

  async getState(sessionId: string) {
    const val = await this.db.one(
      `SELECT state FROM $1~.$2~ WHERE session_id = $3 ${this.softDeleteQuery}`,
      [this.config.schema, this.config.tableName, sessionId]
    );

    return val == null ? undefined : State.fromJSON(JSON.parse(val));
  }

  clear(sessionId: string): void | State {
    const _state = this.states[sessionId];
    delete this.states[sessionId];
    delete this.data[sessionId];

    if (this.config.softDelete == false || this.config.softDelete == null) {
      this.db.none(
        "DELETE FROM $1~.$2~ WHERE session_id = $3",
        [this.config.schema, this.config.tableName, sessionId]
      ).catch((error: Error) => {
        throw error;
      });
    } else {
      this.db.none(
        `UPDATE $1~.$2~ SET updated_at = $3, deleted_at = $3 WHERE session_id = $4 ${this.softDeleteQuery}`,
        [this.config.schema, this.config.tableName, new Date().toISOString(), sessionId]
      ).catch((error: Error) => {
        throw error;
      });
    }

    return _state;
  }

  async set(sessionId: string, key: string, value: any): Promise<void> {
    const val = await this.db.one(
      `UPDATE $1~.$2~ SET data = jsonb_set(data, '{$3}', $4::jsonb), updated_at = $4 WHERE session_id = $5 ${this.softDeleteQuery} RETURNING *`,
      [this.config.schema, this.config.tableName, key, JSON.stringify(value), new Date().toISOString(), sessionId]
    );
    return val;
  }

  async get<T>(
    sessionId: string,
    key: string,
    defaultValue?: T
  ): Promise<T | undefined> {
    const val = await this.db.one(
      `SELECT data FROM $1~.$2~ WHERE session_id = $3 ${this.softDeleteQuery}`,
      [this.config.schema, this.config.tableName, sessionId]
    );

    if (val == null) {
      return defaultValue;
    }

    return (JSON.parse(val)[key] || defaultValue) as T;
  }

  async getAll<T>(sessionId: string): Promise<T | undefined> {
    const val = await this.db.one(
      `SELECT data FROM $1~.$2~ WHERE session_id = $3 ${this.softDeleteQuery}`,
      [this.config.schema, this.config.tableName, sessionId]
    );

    if (val == null) {
      return undefined;
    }

    return JSON.parse(val) as T;
  }
}
