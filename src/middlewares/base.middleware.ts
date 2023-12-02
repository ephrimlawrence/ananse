import { Request, Response } from "@src/types/request";
import { State } from "@src/models/ussd-state";
import { Config } from "@src/config";
import { Session } from "@src/sessions/index.session";

export abstract class Middleware {
  constructor(
    protected readonly request: Request,
    protected readonly response: Response
  ) {}

  get state(): State | undefined {
    return Config.getInstance().session!.getState(this.sessionId);
  }

  get session(): Session {
    return Config.getInstance().session!;
  }

  abstract get sessionId(): string;

  // TODO: add helper to load session/prev state from redis/cache

  // # extract ussd params from request body/parameters/json/form-data
  // # extract session from redis
  abstract handleRequest(req: Request, resp: Response): Promise<void>;

  abstract handleResponse(req: Request, resp: Response): Promise<void>;
  // # pick data from session, eg. req.session
  // # AND
  // # return response based on the expected format of the ussd gateway
}
