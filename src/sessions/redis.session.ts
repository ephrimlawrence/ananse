import { State } from "@src/models";
import { BaseSession } from "./base.session";

// @ts-ignore
import type { RedisClientType } from "redis";
import type { RedisSessionOptions } from "@src/types";

export class RedisSession extends BaseSession {
  private static instance: RedisSession;

  private CLIENT: RedisClientType;
  private config: RedisSessionOptions;

  private constructor() {
    super();
  }

  public static getInstance(): RedisSession {
    if (!RedisSession.instance) {
      RedisSession.instance = new RedisSession();
    }

    return RedisSession.instance;
  }

  async configure(options?: RedisSessionOptions): Promise<void> {
    if (options == null) {
      throw new Error("Redis session configuration is required!");
    }

    this.config = options!;
    this.config.keyPrefix = options?.keyPrefix || "";

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

  async setState(sessionId: string, state: State) {
    this.states[sessionId] = state;

    await this.redisClient().then((client) =>
      client.set(`${sessionId}:state`, JSON.stringify(state.toJSON())),
    );
    return state;
  }

  async getState(sessionId: string) {
    await this.redisClient();
    const val = await this.CLIENT.get(`${sessionId}:state`);

    return val == null ? undefined : State.fromJSON(JSON.parse(val));
  }

  clear(sessionId: string): State {
    const _state = this.states[sessionId];
    delete this.states[sessionId];
    delete this.data[sessionId];

    this.redisClient().then((client) => client.del(`${sessionId}:*`));

    return _state;
  }

  async set(sessionId: string, key: string, value: any): Promise<void> {
    await this.redisClient();
    const val = await this.CLIENT.get(`${sessionId}:data`);

    const data = JSON.parse(val || "{}");
    data[key] = value;

    await this.redisClient().then((client) =>
      client.set(`${sessionId}:data`, JSON.stringify(data)),
    );
  }

  async remove(sessionId: string, key: string): Promise<void> {
    await this.redisClient();
    const val = await this.CLIENT.get(`${sessionId}:data`);

    const data = JSON.parse(val || "{}");
    delete data[key]

    await this.redisClient().then((client) =>
      client.set(`${sessionId}:data`, JSON.stringify(data)),
    );
  }

  async get<T>(
    sessionId: string,
    key: string,
    defaultValue?: T,
  ): Promise<T | undefined> {
    await this.redisClient();
    const val = await this.CLIENT.get(`${sessionId}:data`);

    if (val == null) {
      return defaultValue;
    }

    return (JSON.parse(val)[key] || defaultValue) as T;
  }

  async getAll<T>(sessionId: string): Promise<T | undefined> {
    const val = await this.redisClient().then((client) =>
      client.get(`${sessionId}:data`),
    );

    if (val == null) {
      return undefined;
    }

    return JSON.parse(val) as T;
  }

  private async redisClient() {
    const redis = await import("redis");

    if (this.CLIENT == null) {
      if (this.config.url != null) {
        this.CLIENT = redis.createClient({
          url: this.config.url,
        });
      } else {
        this.CLIENT = redis.createClient({
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

    return this.CLIENT;
  }
}
