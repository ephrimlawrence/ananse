// import { createServer } from "http";
// import { parse } from "url";
// import { ServerResponse, IncomingMessage, IncomingHttpHeaders } from "http";
// import { Request } from "./interfaces/request";
// import App from "./core/app.core";
// import { DefaultMiddleware } from "./middlewares/default.middleware";

// const requestListener = function (req: IncomingMessage, res: ServerResponse) {
//   console.log("hellow");
//   const request = new Request(parse(req.url!, true), req);

//   if (req.method == "POST" || req.method == "PUT" || req.method == "PATCH") {
//     let data = "";

//     req.on("data", (chunk) => {
//       data += chunk;
//     });

//     req.on("end", () => {
//       try {
//         if (req.headers["content-type"] == "application/json") {
//           request.body = JSON.parse(data);
//         }
//         // TODO: parse other content types
//       } catch (error) {
//         res.writeHead(400, { "Content-Type": "application/json" });
//         res.end(
//           JSON.stringify({ error: "Invalid JSON format in the request body" })
//         );
//       }
//     });

//     // res.end("Hello, World!");
//     // TODO: Handle request/response
//   }

//   return new App(request, res)
//     .configure({ middlewares: [new DefaultMiddleware()] })
//     .handle();

//   // TODO: pass request to router
// };

// export const server = createServer(requestListener);
// const server = createServer(requestListener);
// server.listen(3000, "localhost", () => {
//   console.log("Server listening on port 3000");
// });
