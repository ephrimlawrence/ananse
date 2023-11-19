import { Request, Response } from "@src/types/request";
import { Middleware } from "./base.middleware";
import { State } from "@src/models/ussd-state";

export class DefaultMiddleware extends Middleware {
  get sessionId(): string {
    return this.request.query?.sessionid!;
  }

  async handleRequest(): Promise<void> {
    let _state = this.state;

    if (this.isVendorWigal()) {
      _state ??= new State();

      // state.network = req.query?.network;
      _state.mode = this.request.query?.mode as any; //todo: validate
      _state.msisdn = this.request.query?.msisdn!;
      _state.sessionId = this.request.query?.sessionid!;
      _state.userData = this.request.query?.userdata!;
      // state.username = req.query?.username;
      // state.trafficid = req.query?.trafficid;
      // state.other = req.query?.other;

      this.session.setState(this.sessionId, _state);
      this.request.state = this.state!;
    }
  }

  async handleResponse(req: Request, res: Response): Promise<void> {
    if (this.isVendorWigal()) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(this.wigalResponse());
      return;
    }

    // TODO: add africstalking, etc
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(res.data);
  }

  private wigalResponse(): string {
    return `${this.request.query?.network}|${this.state?.mode}|${
      this.state?.msisdn
    }|${this.state?.sessionId}|${this.response.data}|${
      this.request.query?.username
    }|${this.request.query?.trafficid}|${this.state?.nextMenu || ""}`;
  }

  private isVendorWigal(): boolean {
    return (
      this.request.query?.trafficid != null &&
      this.request.query?.username != null
    );
  }
}
