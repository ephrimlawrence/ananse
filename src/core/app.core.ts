import { NextMenu, Type, ValidationResponse } from "@src/types";
import { Request, Response } from "@src/types/request";
import { State } from "@src/models/ussd-state";
import { ServerResponse, IncomingMessage } from "http";
import { createServer } from "http";
import { parse } from "url";
import router, { DynamicMenu, Menu, Menus } from "@src/menus";
import { Config, ConfigOptions } from "@src/config";
import { BaseMenu, MenuAction } from "@src/menus";
import { MENU_CACHE } from "./state.core";
import { menuType, validateInput } from "@src/helpers/index.helper";
import { FormMenuHandler } from "./form_handler";
import { RequestHandler } from "./request_handler";

// TODO: change to project name

export class App {
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
      listeningListener
    );
  }

  // TODO: implement express wrapper
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
            JSON.stringify({ error: "Invalid JSON format in the request body" })
          );
        }
      });
    }

    const handler = new RequestHandler(request, res as Response, this.router);
    await handler.processRequest();
  }
}

export default App;
