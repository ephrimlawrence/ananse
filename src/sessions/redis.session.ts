import { State } from "@src/models/ussd-state";
import { Session, SessionOptions } from "./base.session";
import { RedisClientType, createClient } from "redis";

export class RedisSession extends Session {
  private static instance: RedisSession;
  private keyPrefix: string = "";

  private CLIENT: RedisClientType;
  private config: SessionOptions;

  private constructor() {
    super();
  }

  public static getInstance(): RedisSession {
    if (!RedisSession.instance) {
      RedisSession.instance = new RedisSession();
    }

    return RedisSession.instance;
  }

  async configure(options?: SessionOptions): Promise<void> {
    if (options == null) {
      throw new Error("Redis session configuration is required!");
    }

    this.config = options!;
    this.keyPrefix = options?.keyPrefix || "";

    await this.redisClient();

    // TODO: How data is loaded from redis should be optimized. Idealy, the keys
    // should be the session ids, and the values should be the states and data
    // combined. This way, we can simply load the keys and values, and assign them
    // to the states and data properties respectively. ie. { sessionId: { state, data }}
    // instead of having to loop through the keys and values to get the states (VERY INEFFICIENT!!)
    //

    // Load all the states from redis
    // const keys = await this.CLIENT.keys(`${this.keyPrefix}*`);
    // const states = await this.CLIENT.mGet(keys);

    // states.forEach((state) => {
    //   console.log(state);

    //   const _state = JSON.parse(state!);
    //   this.states[_state.sessionId] = _state;
    // });

    // // Load all the data from redis
    // const data = await this.CLIENT.mGet(keys);
    // data.forEach((data) => {
    //   console.log(data);
    //   const _data = JSON.parse(data!);
    //   this.data[_data.key] = _data.value;
    // });
  }

  setState(id: string, state: State) {
    this.states[id] = state;
    // TODO: Save the state to redis
    return state;
  }

  getState(id: string): State | undefined {
    // TODO: Save the state to redis
    return this.states[id];
  }

  removeState(id: string): void | State {
    // TODO: remove the state to redis
    const _state = this.states[id];
    delete this.states[id];
    return _state;
  }

  async set(sessionId: string, key: string, value: any): Promise<void> {
    if (this.data[sessionId] == null) {
      this.data[sessionId] = {};
    }

    this.data[sessionId][key] = value;

    this.redisClient().then((client) =>
      client.set(sessionId, JSON.stringify(this.data))
    );
  }

  get<T = unknown>(sessionId: string, key: string, defaultValue: T): T {
    if (this.data[sessionId] == null) {
      return defaultValue;
    }

    return (this.data[sessionId][key] || defaultValue) as T;
  }

  getAll<T = unknown>(sessionId: string): T {
    return this.data[sessionId] as T;
  }

  private async redisClient() {
    try {
      if (this.CLIENT == null) {
        if (this.config.url != null) {
          this.CLIENT = createClient({
            url: this.config.url,
          });
        } else {
          this.CLIENT = createClient({
            username: this.config.username!,
            socket: {
              host: this.config.host || "localhost",
              port: this.config.port || 6379,
            },
            database: this.config.database as number,
            password: this.config.password!,
          });
        }
      }
      if (!this.CLIENT?.isOpen) {
        await this.CLIENT.connect();
      }
    } catch (error) {
      throw error;
    }

    return this.CLIENT;
  }
}
