import { Request, Response } from "@src/interfaces/request";
import { USSDState } from "@src/models/ussd-state";

export abstract class Middleware {
  constructor(protected state: USSDState) {}

  abstract get sessionId(): string;

  // # extract ussd params from request body/parameters/json/form-data
  // # extract session from redis
  abstract handleRequest(req: Request, resp: Response): Promise<void>;

  abstract handleResponse(req: Request, resp: Response): Promise<void>;
  // # pick data from session, eg. req.session
  // # AND
  // # return response based on the expected format of the ussd gateway
}
