import { Middleware } from "./middlewares/base.middleware";
import { DefaultMiddleware } from "./middlewares/default.middleware";
import { Session } from "./sessions/base.session";
import { MemcacheSession } from "./sessions/memcache.session";
import { Type } from "./types";

export class Config {
  private static instance: Config;

  private _middlewares: Type<Middleware>[] = [];

  private _session: Session | undefined = undefined;

  // private states: { [key: string]: State } = {};

  private constructor() {}

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }

    return Config.instance;
  }

  init(options: ConfigOptions) {
    if ((options.middlewares || []).length == 0) {
      this._middlewares = [DefaultMiddleware];
    } else {
      this._middlewares = options.middlewares!;
    }

    // Resolve session
    const _session = options.session || "memory";

    // If session is already an instance of Session, then we are good to go
    if (this._session instanceof Session) {
      return this;
    }

    if (_session === "memory") {
      this._session = MemcacheSession.getInstance();
      return this;
    }
    if (typeof _session === "object") {
      // Configure is provided, so we need to create a new instance of the session
      if (_session?.type != null) {
        switch (_session.type) {
          case "redis":
            throw new Error("Redis session not implemented yet");
          case "mongo":
            throw new Error("Mongo session not implemented yet");
          case "postgres":
            throw new Error("Postgres session not implemented yet");
          default:
            throw new Error("Invalid session type");
        }
      }
      console.log(typeof _session);
      // A session class is provided, so we need to create a new instance of the session
      this._session = _session as unknown as Session;
    }

    return this;
  }

  get middlewares(): Type<Middleware>[] {
    return this._middlewares;
  }

  get session(): Session | undefined {
    return this._session;
  }
}

export interface ConfigOptions {
  middlewares?: Type<Middleware>[];
  session?: "memory" | SessionOptions | Type<Session>;
}

interface SessionOptions {
  type: "redis" | "mongo" | "postgres";
  host?: string;
  port?: number;
  url?: string;
  username?: string;
  password?: string;
}
