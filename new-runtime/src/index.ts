import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { parse } from "node:url";
import { Request as Req, Response as Resp } from "./types";

export function listen(
	requestHandler: (runtimeRequest: Req, runtimeResponse: Resp) => void,
	port?: number,
	hostname?: string,
	listeningListener?: () => void,
) {
	const requestListener = (req: IncomingMessage, res: ServerResponse) => {
		const host = req.headers.host ?? "localhost";
		// const url = req.url ? new URL(req.url, `http://${host}`) : new URL("/", `http://${host}`);
		const url = new URL(req.url!, `http://${host}`);
		const request: Req = {
			query: Object.fromEntries(
				Array.from(url.searchParams.entries()),
			) as Record<string, string>,
			body: null,
		};

		if (
			req.method === "POST" ||
			req.method === "PUT" ||
			req.method === "PATCH"
		) {
			let data = "";

			req.on("data", (chunk) => {
				data += chunk;
			});

			req.on("end", () => {
				try {
					if (req.headers["content-type"] === "application/json") {
						// request = new Request(new URL(req.url!), {
						// 	method: req.method,
						// 	headers: req.headers as Record<string, string>,
						// 	body: JSON.parse(data),
						// });
						request.body = JSON.parse(data);
					}
					// TODO: parse other content types
					requestHandler(request, res);
				} catch {
					res.writeHead(400, { "Content-Type": "application/json" });
					res.end(
						JSON.stringify({
							error: "Invalid JSON format in the request body",
						}),
					);
				}
			});
		}

		requestHandler(request, res);
	};

	return createServer((req, res) => requestListener(req, res)).listen(
		port,
		hostname,
		listeningListener,
	);
}

export { Runtime } from "./runtime";
export { Request, Response, SessionMode } from "./types";
export { isMatch } from "./helpers";
