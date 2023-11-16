import { Request, Response } from "@src/interfaces/request";
import { Middleware } from "./base.middleware";
import { USSDState } from "@src/models/ussd-state";

export class DefaultMiddleware extends Middleware {
  get sessionId(): string {
    return this.state.sessionId;
  }

  async handleRequest(req: Request, resp: Response): Promise<void> {
    if (this.isVendorWigal(req)) {
      let state: USSDState = new USSDState();

      // state.network = req.query?.network;
      state.mode = req.query?.mode as any; //todo: validate
      state.msisdn = req.query?.msisdn!;
      state.sessionId = req.query?.sessionid!;
      state.userData = req.query?.userdata!;
      // state.username = req.query?.username;
      // state.trafficid = req.query?.trafficid;
      // state.other = req.query?.other;

      req.state = state;
      this.state = state;
    }
  }

  async handleResponse(req: Request, res: Response): Promise<void> {
    if (this.isVendorWigal(req)) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(this.wigalResponse(req, res));
      return;
    }

    // TODO: add africstalking, etc
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(res.data);
  }

  private wigalResponse(req: Request, res: Response): string {
    return `network=${req.query?.network}&sessionid=${
      this.state.sessionId
    }&mode=${this.state.mode}&msisdn=${this.state.msisdn}&userdata=${
      res.data
    }&username=${req.query?.username}&trafficid=${req.query?.trafficid}&other=${
      this.state.nextMenu || ""
    }`;
  }

  private isVendorWigal(req: Request): boolean {
    return req.query?.trafficid != null && req.query?.username != null;
  }
}
