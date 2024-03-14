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
  | ((req: Request, resp: Response) => Promise<ValidationResponse> | ValidationResponse);
