import { createServer } from "http";
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

    res.end("Hello, World!");
    return new App(request, res).handle();
    // TODO: Handle request/response
  }

  // TODO: pass request to router
};

// export const server = createServer(requestListener);
const server = createServer(requestListener);
server.listen(3333, "localhost", () => {
  console.log("Server listening on port 3333");
});
