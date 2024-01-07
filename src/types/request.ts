import { State } from "@src/models/ussd-state";
import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";
import { ParsedUrlQuery } from "querystring";
import { Url } from "url";

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
