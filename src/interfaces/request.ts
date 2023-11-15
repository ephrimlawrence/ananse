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

  headers: IncomingHttpHeaders;

  body: any;

  query?: ParsedUrlQuery | null | string;

  constructor(_url: Url, req: IncomingMessage) {
    this.method = req.method as any;
    this.path = _url.pathname;
    this.url = _url.href;
    this.headers = req.headers;
    this.query = _url.query;
  }
}

export class Response extends ServerResponse {}
