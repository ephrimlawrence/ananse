import { Request, Response } from "./request";
/**
 * The validation response can be a boolean or a string.
 *
 * If `string`, the value is used as the error message, thus the input is invalid.
 * If `boolean`, the value is used to determine if the input is valid or not.
 */
export type ValidationResponse = boolean | string;

export type Validation =
  | RegExp
  | ((req: Request, resp: Response) => ValidationResponse);

export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}


export type Session = {
  get: <T>(key: string, defaultValue?: any) => Promise<T | undefined>;
  getAll: <T>() => Promise<T | undefined> | undefined;
  set: (key: string, val: any) => Promise<void> | undefined;
};

export type FormInput = {
  name: string;
  validate: Validation;
  display: string | ((req: Request) => Promise<string>);
  handler: (req: Request, session: Session) => Promise<void>;
  next_input?: string | ((req: Request) => Promise<string>);
  end?: boolean | ((req: Request) => boolean);
  next_menu?: NextMenu;
};

export type NextMenu =
  | string
  | ((req: Request, resp: Response) => Promise<string>);

export { Request, Response };
