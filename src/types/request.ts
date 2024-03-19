import { State } from "@src/models";
import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";
import { Url } from "url";
import { Session } from ".";

export class Request {
  method:
    | "GET"
    | "POST"
    | "PUT"
    | "DELETE"
    | "PATCH"
    | "HEAD"
    | "OPTIONS"
    | "CONNECT"
    | "TRACE";

  path?: string | null;

  url: string;

  msisdn?: string;

  /**
   * The input from the user
   */
  input?: string;

  headers: IncomingHttpHeaders;

  body: any;

  query?: Record<string, string>;

  /**
   * Current USSD state. Is null until the request is processed by the middlewares
   */
  state: State;
  session: Session;

  constructor(_url: Url, req: IncomingMessage) {
    this.method = req.method as any;
    this.path = _url.pathname;
    this.url = _url.href;
    this.headers = req.headers;
    this.query = _url.query as Record<string, string>;
  }
}

export class Response extends ServerResponse {
  data: Record<string, any> | any;
}
