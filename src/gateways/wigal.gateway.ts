import { Request, Response } from "@src/types/request";
import { Gateway } from "./base.gateway";
import { State } from "@src/models/ussd-state";

export class WigalGateway extends Gateway {
  get sessionId(): string {
    return this.request.query?.sessionid!;
  }

  async handleRequest(): Promise<State | undefined> {
    let _state = await this.state;

    _state ??= new State();

    _state.mode = this.request.query?.mode as any; //todo: validate
    _state.msisdn = this.request.query?.msisdn!;
    _state.sessionId = this.request.query?.sessionid!;
    _state.userData = this.request.query?.userdata!;

    // await this.session.setState(this.sessionId, _state);
    this.request.state = _state;
    this.request.input = this.request.query?.userdata!;


    return _state;
  }

  async handleResponse(_req: Request, res: Response): Promise<void> {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(await this.wigalResponse());
    return;
  }

  private async wigalResponse(): Promise<string> {
    const data = (await this.state)!;
    return `${this.request.query?.network}|${data?.mode}|${data?.msisdn}|${data?.sessionId
      }|${this.response.data}|${this.request.query?.username}|${this.request.query?.trafficid
      }|${data?.menu?.nextMenu || ""}`;
  }
}
