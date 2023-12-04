import { Request, Response } from "@src/types/request";
import { Middleware } from "./base.middleware";
import { State } from "@src/models/ussd-state";

export class DefaultMiddleware extends Middleware {
  get sessionId(): string {
    return this.request.query?.sessionid!;
  }

  async handleRequest(): Promise<State | undefined> {
    let _state = await this.state;

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

      await this.session.setState(this.sessionId, _state);
      this.request.state = _state;
    }

    return _state;
  }

  async handleResponse(req: Request, res: Response): Promise<void> {
    if (this.isVendorWigal()) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(await this.wigalResponse());
      return;
    }

    // TODO: add africstalking, etc
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(res.data);
  }

  private async wigalResponse(): Promise<string> {
    const data = (await this.state)!;
    return `${this.request.query?.network}|${data?.mode}|${data?.msisdn}|${
      data?.sessionId
    }|${this.response.data}|${this.request.query?.username}|${
      this.request.query?.trafficid
    }|${data?.nextMenu || ""}`;
  }

  private isVendorWigal(): boolean {
    return (
      this.request.query?.trafficid != null &&
      this.request.query?.username != null
    );
  }
}
