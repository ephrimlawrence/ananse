import { Request, Response } from "./request";
import { Validation, ValidationResponse } from "./validation.type";

export interface Type<T = any> extends Function {
	new (...args: any[]): T;
}

export type Session = {
	get: <T>(key: string, defaultValue?: any) => Promise<T | undefined>;
	getAll: <T>() => Promise<T | undefined> | undefined;
	set: (key: string, val: any) => Promise<void> | undefined;
};

export type FormInput = {
	name: string;
	validate: Validation;
	display: string | ((req: Request) => Promise<string> | string);
	handler?: (req: Request) => Promise<void>;
	next_input?: string | ((req: Request) => Promise<string> | string | undefined);
	end?: boolean | ((req: Request) => boolean);
	next_menu?: NextMenu;
};

export type NextMenu =
	| string
	| ((req: Request, resp: Response) => Promise<string>);

export { Request, Response, Validation, ValidationResponse };
export * from "./config_options.type";
