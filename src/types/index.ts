import { Request, Response } from "./request";

export type ValidationResponse = boolean | string;

export type Validation =
  | RegExp
  | ((req: Request, resp: Response) => ValidationResponse);

export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}

export enum Gateway {
  wigal = "wigal",
  hubtel = "hubtel",
}

export type Session = {
  get: <T>(key: string, defaultValue?: any) => Promise<T | undefined>;
  getAll: <T>() => Promise<T | undefined> | undefined;
  set: (key: string, val: any) => Promise<void> | undefined;
};
