export type CacheOptions = RedisCacheOptions | SQLCacheOptions;

export interface BaseCacheOptions {
	host?: string | undefined;
	port?: number | undefined;
	url?: string;
	username?: string | undefined;
	password?: string | undefined;
	database?: string | number | undefined;
}

export interface SQLCacheOptions extends BaseCacheOptions {
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

export interface RedisCacheOptions extends BaseCacheOptions {
	type: "redis";
	keyPrefix?: string;
}
