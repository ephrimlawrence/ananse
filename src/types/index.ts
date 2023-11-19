import { Request, Response } from "./request";

export type ValidationResponse = boolean | string;

export type Validation =
  | string
  | RegExp
  | ((req: Request, resp: Response) => ValidationResponse);

export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}
