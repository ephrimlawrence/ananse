import { Request, type Response } from "@src/types/request";
import type { ServerResponse, IncomingMessage } from "node:http";
import { createServer } from "node:http";
import { parse } from "node:url";
import type { Menus } from "@src/menus";
import { Config, type ConfigOptions } from "@src/config";
import { RequestHandler } from "./request_handler";

// @ts-ignore
import type {
	Request as ExpressRequest,
	Response as ExpressResponse,
} from "express";

export class Ananse {
	private router: Menus;

	configure(opts: ConfigOptions) {
		const instance = Config.getInstance();
		instance.init(opts);

		return this;
	}

	listen(port?: number, hostname?: string, listeningListener?: () => void) {
		return createServer((req, res) => this.requestListener(req, res)).listen(
			port,
			hostname,
			listeningListener,
		);
	}

	private async requestListener(req: IncomingMessage, res: ServerResponse) {
		const request = new Request(parse(req.url!, true), req);

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
						JSON.stringify({
							error: "Invalid JSON format in the request body",
						}),
					);
				}
			});
		}

		const handler = new RequestHandler(request, res as Response, this.router);
		await handler.processRequest();
	}

	async express(req: ExpressRequest, res: ExpressResponse) {
		const request = new Request(parse(req.url!, true), req);

		if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
			const data = req.body;

			try {
				if (req.headers["content-type"] != null && req.headers["content-type"]?.indexOf("application/json") > -1) {
					request.body = data;
				}
				// TODO: parse other content types
			} catch (error) {
				res
					.status(400)
					.json({ error: "Invalid JSON format in the request body" });
			}
		}

		const handler = new RequestHandler(
			request,
			res as unknown as Response,
			this.router,
		);
		return await handler.processRequest();
	}
}
