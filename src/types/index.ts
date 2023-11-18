import { Request, Response } from "./request";

export type ValidationResponse = boolean | string;

export type Validation = (
  data: string | RegExp | ((req: Request, resp: Response) => ValidationResponse)
) => ValidationResponse;

export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}
