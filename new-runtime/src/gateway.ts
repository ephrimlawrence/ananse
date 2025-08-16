import { GatewayData, Request, Response, SessionMode } from "./types";
import { Session } from "./session";

export class WigalGateway {
	requestHandler(request: Request): GatewayData {
		const mode = request.query?.mode as string;
		//todo: throw error if not valid mode

		return {
			phone: request.query?.msisdn!,
			mode: mode as SessionMode,
			userData: request.query?.userdata!,
			sessionId: request.query?.sessionid!,
			extra: {
				username: request.query?.username!,
				network: request.query?.network!,
				trafficId: request.query?.trafficid!,
			},
		};
	}

	responseHandler(
		req: Request,
		res: Response,
		session: Session,
		message: string,
		nextMenu?: string,
	): Response {
		res.writeHead(200, { "Content-Type": "text/plain" });

		let msg = `${req.query?.network}|${session.mode()}|${session.phone()}|`;
		msg += `${session?.sessionId()}|${message.trim().replace(/\n/g, "^") ?? ""}|`;
		msg += `${req.query?.username}|${req.query?.trafficid}|${nextMenu || ""}`;

		return res.end(msg);
		// return;
	}
}
