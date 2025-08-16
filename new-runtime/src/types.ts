import { ServerResponse } from "node:http";

export enum SessionMode {
	start = "start",
	more = "more",
	end = "end",
}

// export type
export type Request = {
	query?: Record<string, string>;
	body: any;
};

export type GatewayData = {
	mode: SessionMode;
	userData: string | null;
	sessionId: string;
	phone: string;
	extra?: {
		network?: string;
		username?: string;
		trafficId?: string;
	};
};

export class Response extends ServerResponse {
	// data: Record<string, any> | any;
}
