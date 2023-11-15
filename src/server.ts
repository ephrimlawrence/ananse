import http from "https";
import url from "url";
import { ServerResponse, IncomingMessage, IncomingHttpHeaders } from "http";
import { Request } from "./interfaces/request";
import App from "./core/app.core";

const requestListener = function (req: IncomingMessage, res: ServerResponse) {
  const request = new Request(url.parse(req.url!, true), req);

  if (req.method == "POST" || req.method == "PUT" || req.method == "PATCH") {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      try {
        if (req.headers["content-type"] == "application/json") {
          request.body = JSON.parse(data);
        }
        // TODO: parse other content types
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: "Invalid JSON format in the request body" })
        );
      }
    });

    return new App(request, res).handle();
    // res.end("Hello, World!");
    // TODO: Handle request/response
  }

  // TODO: pass request to router
};

export const server = http.createServer(requestListener);
