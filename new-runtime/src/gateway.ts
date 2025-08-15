import { GatewayData, Request, Response, SessionMode } from "./types";
import { Session } from "./session";

export class WigalGateway {
	async requestHandler(request: Request): Promise<GatewayData> {
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

	async responseHandler(
		req: Request,
		res: Response,
		session: Session,
		message: string,
	): Promise<void> {
		res.writeHead(200, { "Content-Type": "text/plain" });

		let msg = `${req.query?.network}|${session.mode}|${session.mode}|`;
		msg += `${session?.sessionId}|${message?.replace(/\n/g, "^") ?? ""}|`;
		msg += `${req.query?.username}|${req.query?.trafficid}|${session.getNextMenu() || ""}`;

		res.end(msg);
		return;
	}
}
