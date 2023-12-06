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
