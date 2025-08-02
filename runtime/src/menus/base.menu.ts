import { Config } from "@src/config";
import { FormInput, Session, ValidationResponse } from "@src/types";
import { MenuAction } from "./action.menu";
import { Request, Response } from "@src/types/request";

export abstract class BaseMenu {
	constructor(
		protected readonly request: Request,
		protected readonly response: Response,
	) {}

	async validate(_data?: string): Promise<ValidationResponse> {
		return true;
	}

	paginate(): Promise<boolean> | boolean {
		return false;
	}

	abstract message(): Promise<string> | string | undefined;

	abstract nextMenu(): Promise<string | undefined> | string | undefined;

	/**
	 * Terminate the current session
	 *
	 */
	end(): Promise<boolean> | boolean {
		return false;
	}

	get sessionId(): string {
		// FIXME: this is not reliable, add to request object
		return this.request.query?.sessionid!;
	}

	isStart(): Promise<boolean> | boolean {
		return false;
	}

	get session(): Session {
		return {
			get: async <T>(key: string, defaultValue?: any) => {
				return await Config.getInstance().session?.get<T>(
					this.sessionId!,
					key,
					defaultValue,
				);
			},
			getAll: <T>() => {
				return Config.getInstance().session?.getAll<T>(this.sessionId!);
			},
			set: (key: string, val: any) =>
				Config.getInstance().session?.set(this.sessionId!, key, val),
      remove: (key: string) =>
        Config.getInstance().session?.remove(this.sessionId!, key),
		};
	}

	/**
	 * Returns the current msisdn/phone number of the session.
	 */
	get msisdn(): string {
		return this.request.state.msisdn;
	}

	async back(): Promise<string | undefined> {
		return undefined;
	}

	abstract actions(): Promise<MenuAction[]> | MenuAction[];

	async inputs(): Promise<FormInput[]> {
		return [];
	}

	isForm(): boolean {
		return false;
	}
}
