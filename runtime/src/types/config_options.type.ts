export type SessionOptions = RedisSessionOptions | SQLSessionOptions;

export interface BaseSessionOptions {
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

export class PaginationOption {
	/**
	 * Pagination is enabled by default if the content of the message to display is
	 * more than the maximum 182 characters allowed.
	 */
	enabled: boolean = true;

	nextPage: {
		display: string;
		choice: string;
	} = { display: "*. More", choice: "*" };

	previousPage: {
		display: string;
		choice: string;
	} = { display: "#. Back", choice: "#" };
}
