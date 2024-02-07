import { State } from "@src/models/ussd-state";
import { BaseSession, SQLSessionOptions } from "./base.session";
import mysql from 'mysql2/promise';

/**
 * PostgreSQL session manager
 * A session manager that uses postgres as the session store
 *
 * It is assumed that database has a session table with following schema:
 * ```sql
 * CREATE TABLE ussd_sessions (
 *   id UUID PRIMARY KEY,
 *   session_id VARCHAR(255),
 *  state JSONB DEFAULT '{}',
 *   data JSONB DEFAULT '{}',
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
 *   deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
 * );
 * -- comment this out (and use the next code) if you want to use soft delete
 * CREATE UNIQUE INDEX session_uniq_key ON ussd_sessions (session_id);
 *
 * -- use this index, if soft delete is enabled
 * -- CREATE UNIQUE INDEX session_uniq_key ON ussd_session (session_id, deleted_at);
 * ```
 */
export class MySQLSession extends BaseSession {
  private static instance: MySQLSession;

  private config: SQLSessionOptions;
  private db: any;

  private constructor() {
    super();
  }


  public static getInstance(): MySQLSession {
    if (!MySQLSession.instance) {
      MySQLSession.instance = new MySQLSession();
    }

    return MySQLSession.instance;
  }

  async configure(options: SQLSessionOptions): Promise<void> {
    if (options == null) {
      throw new Error("Postgres session configuration is required!");
    }
    this.config = options;
    this.config.tableName ??= "ussd_sessions";

    let mysql;

    try {
      mysql = await import('mysql2/promise');
    } catch (error) {
      throw new Error("'mysql2/promise' module is required for postgres session. Please install it using 'npm install mysql2/promise' or 'yarn add mysql2/promise'")
    }

    this.db = await mysql.createConnection({
      host: this.config?.host || 'localhost',
      user: this.config.username || 'root',
      database: this.config.database,
      password: this.config.password as string,
    });
  }

  private get softDeleteQuery() {
    if (this.config.softDelete == false || this.config.softDelete == null) return "";

    return "AND deleted_at IS NULL";
  }

  async setState(sessionId: string, state: State) {
    this.states[sessionId] = state;

    // Write postgres query to insert or update state
    await this.db.query(
      `INSERT INTO ? (session_id, state, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, NULL)
     ON CONFLICT (session_uniq_key) DO UPDATE SET state = ?, updated_at = ? WHERE session_id = ? ${this.softDeleteQuery}`,
      [this.config.tableName, sessionId,
      JSON.stringify(state.toJSON()), new Date().toISOString(), JSON.stringify(state.toJSON()),
      new Date().toISOString(), sessionId
      ]
    );
    return state;
  }

  async getState(sessionId: string) {
    const [val, _fields] = await this.db.query(
      `SELECT state FROM ? WHERE session_id = ? ${this.softDeleteQuery}`,
      [this.config.tableName, sessionId]
    );

    return val == null ? undefined : State.fromJSON(JSON.parse(val));
  }

  clear(sessionId: string): void | State {
    const _state = this.states[sessionId];
    delete this.states[sessionId];
    delete this.data[sessionId];

    if (this.config.softDelete == false || this.config.softDelete == null) {
      this.db.query(
        "DELETE FROM ? WHERE session_id = ?",
        [this.config.tableName, sessionId]
      ).catch((error: Error) => {
        throw error;
      });
    } else {
      this.db.none(
        `UPDATE ? SET updated_at = ?, deleted_at = ? WHERE session_id = ? ${this.softDeleteQuery}`,
        [this.config.tableName, new Date().toISOString(), new Date().toISOString(), sessionId]
      ).catch((error: Error) => {
        throw error;
      });
    }

    return _state;
  }

  async set(sessionId: string, key: string, value: any): Promise<void> {
    const [val] = await this.db.query(
      `UPDATE ? SET data = JSON_SET(data, '$.?', ?), updated_at = ? WHERE session_id = ? ${this.softDeleteQuery} RETURNING *`,
      [this.config.tableName, key, JSON.stringify(value), new Date().toISOString(), sessionId]
    );
    return val;
  }

  async get<T>(
    sessionId: string,
    key: string,
    defaultValue?: T
  ): Promise<T | undefined> {
    const [val] = await this.db.one(
      `SELECT data FROM ? WHERE session_id = ? ${this.softDeleteQuery}`,
      [this.config.tableName, sessionId]
    );

    if (val == null) {
      return defaultValue;
    }

    return (JSON.parse(val)[key] || defaultValue) as T;
  }

  async getAll<T>(sessionId: string): Promise<T | undefined> {
    const [val] = await this.db.one(
      `SELECT data FROM ? WHERE session_id = ? ${this.softDeleteQuery}`,
      [this.config.tableName, sessionId]
    );

    if (val == null) {
      return undefined;
    }

    return JSON.parse(val) as T;
  }
}
