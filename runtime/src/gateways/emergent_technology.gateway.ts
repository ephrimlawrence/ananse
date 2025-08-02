import { Request, Response } from "@src/types/request";
import { Gateway } from "./base.gateway";
import { State, StateMode } from "@src/models";

interface IEmergentRequest {
	Type: "initiation" | "response" | "release" | "timeout";
	Mobile: string;
	SessionId: string;
	ServiceCode: string;
	Message: string;
	Operator: string;
}

export class EmergentTechnologyGateway extends Gateway {
	get sessionId(): string {
		return (this.request.body as IEmergentRequest)?.SessionId!;
	}

	async handleRequest(): Promise<State | undefined> {
		let _state = await this.state;

		_state ??= new State();

		const body = this.request.body as IEmergentRequest;

		_state.mode = this.getMode(body.Type.toLowerCase());
		_state.msisdn = body.Mobile;
		_state.sessionId = body.SessionId;
		_state.userData = body.Message;

		this.request.state = _state;
		this.request.msisdn = _state.msisdn;
		this.request.serviceCode = body.ServiceCode;

		// The content of Message for session initiation is always the service short code value
		// We don't really need it, given that it is start of a session
		if (_state.mode === StateMode.start) {
			this.request.input = "";
		} else {
			this.request.input = body.Message;
		}

		return _state;
	}

	async handleResponse(req: Request, res: Response): Promise<void> {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(
			JSON.stringify({
				Message: this.response.data,
				Type: req.state.mode == StateMode.more ? "Response" : "Release",
			}),
		);
	}

	private getMode(type: string): StateMode {
		switch (type.toLowerCase()) {
			case "initiation":
				return StateMode.start;
			case "response":
				return StateMode.more;
			case "release":
			case "timeout":
				return StateMode.end;
			default:
				return StateMode.start;
		}
	}
}
