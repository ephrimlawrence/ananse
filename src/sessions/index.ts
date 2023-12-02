// import { State } from "@src/models/ussd-state";

// export abstract class Session {
//   protected readonly states: { [key: string]: State } = {};
//   protected readonly data: { [key: string]: any } = {};

//   // TODO: change this to a proper configuration based on the session type
//   configure(opts?: {
//     host?: string;
//     port?: number;
//     url?: string;
//     username?: string;
//     password?: string;
//   }): void {
//     throw new Error("Method not implemented.");
//   }

//   abstract setState(id: string, state: State): State;

//   abstract getState(id: string): State | undefined;

//   abstract removeState(id: string): void | State;

//   abstract set(key: string, value: any): Session;

//   abstract get<T = unknown>(key: string, defaultValue: T): T | unknown;
// }

export { Session, SessionOptions } from "./base.session";
