import { State } from "@src/models/ussd-state";
import { BaseSession, SQLSessionOptions } from "./base.session";

/**
 * MySQL session manager
 * A session manager that uses mysql as the session store
 *
 * It is assumed that database has a session table with following schema:
 * ```sql
 * CREATE TABLE ussd_sessions (
 *   id INTEGER PRIMARY KEY AUTO_INCREMENT,
 *   session_id VARCHAR(255),
 *   state JSON DEFAULT '{}',
 *   data JSON DEFAULT '{}',
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 *   deleted_at TIMESTAMP NULL DEFAULT NULL,
 *   UNIQUE KEY session_uniq_key (session_id)
 *   -- or uncomment the this for soft delete constraint
 *   -- UNIQUE KEY session_uniq_key (session_id, deleted_at)
 * );
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
      mysql = await import("mysql2/promise");
    } catch (error) {
      throw new Error(
        "'mysql2/promise' module is required for postgres session. Please install it using 'npm install mysql2/promise' or 'yarn add mysql2/promise'",
      );
    }

    this.db = await mysql.createConnection({
      host: this.config?.host || "localhost",
      user: this.config.username || "root",
      database: this.config.database,
      password: this.config.password as string,
    });
  }

  private get softDeleteQuery() {
    if (this.config.softDelete == false || this.config.softDelete == null)
      return "";

    return "AND deleted_at IS NULL";
  }

  private get tableName() {
    return this.config.tableName!
  }

  async setState(sessionId: string, state: State) {
    this.states[sessionId] = state;

    // Write postgres query to insert or update state
    await this.db.query(
      `INSERT INTO ${this.tableName} (session_id, state, created_at, updated_at) VALUES (?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE state = ?`,
      [
        sessionId,
        JSON.stringify(state.toJSON()),
        JSON.stringify(state.toJSON()),
        sessionId,
      ],
    );
    return state;
  }

  async getState(sessionId: string) {
    const [resp, _fields] = await this.db.query(
      `SELECT state FROM ${this.tableName} WHERE session_id = ? ${this.softDeleteQuery} LIMIT 1`,
      [sessionId],
    );

    if(resp.length == 0) return undefined;

    return resp == null ? undefined : State.fromJSON(JSON.parse(resp[0].state));
  }

  clear(sessionId: string): void | State {
    const _state = this.states[sessionId];
    delete this.states[sessionId];
    delete this.data[sessionId];

    if (this.config.softDelete == false || this.config.softDelete == null) {
      this.db
        .query(`DELETE FROM ${this.tableName} WHERE session_id = ?`, [
          sessionId,
        ])
        .catch((error: Error) => {
          throw error;
        });
    } else {
      this.db
        .query(
          `UPDATE ${this.tableName} SET deleted_at = ? WHERE session_id = ? ${this.softDeleteQuery}`,
          [new Date().toISOString(), sessionId],
        )
        .catch((error: Error) => {
          throw error;
        });
    }

    return _state;
  }

  async set(sessionId: string, key: string, value: any): Promise<void> {
    const [val] = await this.db.query(
      `UPDATE ${this.tableName} SET data = JSON_SET(data, '$.${key}', ?) WHERE session_id = ? ${this.softDeleteQuery}`,
      [JSON.stringify(value), sessionId],
    );
    return await this.get(sessionId, key, value);
  }

  async get<T>(
    sessionId: string,
    key: string,
    defaultValue?: T,
  ): Promise<T | undefined> {
    const [val] = await this.db.query(
      `SELECT data FROM ${this.tableName} WHERE session_id = ? ${this.softDeleteQuery} LIMIT 1`,
      [sessionId],
    );

    if (val == null) {
      return defaultValue;
    }

    return (val[key] || defaultValue) as T;
  }

  async getAll<T>(sessionId: string): Promise<T | undefined> {
    const [val] = await this.db.query(
      `SELECT data FROM ${this.tableName} WHERE session_id = ? ${this.softDeleteQuery}`,
      [sessionId],
    );

    if (val == null) {
      return undefined;
    }

    return val as T;
  }
}
