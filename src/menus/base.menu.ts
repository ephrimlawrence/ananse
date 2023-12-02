import { Config } from "@src/config";
import { Session } from "@src/sessions";
import { ValidationResponse } from "@src/types";
import { MenuAction } from "./action.menu";
import { Request, Response } from "@src/types/request";

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

  get sessionId(): string {
    return this.request.query?.sessionid!;
  }

  get isStart(): Promise<boolean> {
    return Promise.resolve(false);
  }

  get session() {
    return {
      get: async <T>(key: string, defaultValue?: any) =>
        await Config.getInstance().session?.get<T>(
          this.sessionId!,
          key,
          defaultValue
        ),

      getAll: <T>() => {
        return Config.getInstance().session?.getAll<T>(this.sessionId!);
      },
      set: (key: string, val: any) =>
        Config.getInstance().session?.set(this.sessionId!, key, val),
    };
  }

  async back(): Promise<string | undefined> {
    return undefined;
  }

  abstract actions(): Promise<MenuAction[]>;
}
