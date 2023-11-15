import { Request, Response } from "@src/interfaces/request";
import { Middleware } from "./base.middleware";
import { USSDState } from "@src/models/ussd-state";

export class DefaultMiddleware implements Middleware {
  async handleRequest(req: Request, resp: Response): Promise<void> {
    // We assume the vendor is Wigal
    if (req.query?.trafficid != null && req.query?.username != null) {
      let state: USSDState = new USSDState();

      state.network = req.query?.network;
      state.mode = req.query?.mode as any; //todo: validate
      state.msisdn = req.query?.msisdn;
      state.sessionId = req.query?.sessionid;
      state.userData = req.query?.userdata;
      // state.username = req.query?.username;
      // state.trafficid = req.query?.trafficid;
      // state.other = req.query?.other;

      req.state = state;
    }
  }
  async handleResponse(req: Request, res: Response): Promise<void> {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(res.data);
  }
}
