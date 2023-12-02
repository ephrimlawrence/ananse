import { Config } from "@src/config";
import { Session } from "@src/sessions";
import { ValidationResponse } from "@src/types";
import { MenuAction } from "./action.menu";

export abstract class BaseMenu {
  constructor(
    protected readonly request: Request,
    protected readonly response: Response
  ) {}

  async validate(data?: string): Promise<ValidationResponse> {
    return true;
  }

  abstract message(): Promise<string>;

  abstract nextMenu(): Promise<string | undefined>;

  get isStart(): Promise<boolean> {
    return Promise.resolve(false);
  }

  get session(): Session {
    return Config.getInstance().session!;
  }

  async back(): Promise<string | undefined> {
    return undefined;
  }

  abstract actions(): Promise<MenuAction[]>;
}
