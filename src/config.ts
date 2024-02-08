import { SupportGateway } from "./helpers/constants";
import { Gateway } from "./gateways/base.gateway";
import { WigalGateway } from "./gateways/wigal.gateway";
import { BaseSession, PostgresSession, SessionOptions } from "./sessions";
import { MemcacheSession } from "./sessions/memcache.session";
import { MySQLSession } from "./sessions/mysql.session";
import { RedisSession } from "./sessions/redis.session";
import { Type } from "./types";
import { EmergentTechnologyGateway } from "./gateways/emergent_technology.gateway";

export class Config {
  private static instance: Config;

  #gateway: Type<Gateway>;

  private _session: BaseSession | undefined = undefined;

  private constructor() {}

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }

    return Config.instance;
  }

  init(options: ConfigOptions) {
    if (typeof options.gateway == "string") {
      switch (options.gateway) {
        case SupportGateway.wigal:
          this.#gateway = WigalGateway;
          break;
        case SupportGateway.emergent_technology:
          this.#gateway = EmergentTechnologyGateway;
          break;
      }
    } else {
      // TODO: implement for custom gateway class
    }

    // Resolve session
    const _session = options.session || "memory";

    // If session is already an instance of Session, then we are good to go
    if (this._session instanceof BaseSession) {
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
            this._session = RedisSession.getInstance();
            this._session.configure(_session);
            break;
          case "postgres":
            this._session = PostgresSession.getInstance();
            this._session.configure(_session);
          case "mysql":
            this._session = MySQLSession.getInstance();
            this._session.configure(_session);
          // case "mongo":
          //   throw new Error("Mongo session not implemented yet");
          default:
            throw new Error("Invalid session type");
        }
      }
      // A session class is provided, so we need to create a new instance of the session
      // this._session = _session as unknown as Session;
    }

    return this;
  }

  get gateway(): Type<Gateway> {
    return this.#gateway;
  }

  get session(): BaseSession | undefined {
    return this._session;
  }
}

type CustomSession = Type<BaseSession>;

export interface ConfigOptions {
  middlewares?: Type<Gateway>[];
  session?: "memory" | SessionOptions | CustomSession;
  gateway: keyof typeof SupportGateway;
}
