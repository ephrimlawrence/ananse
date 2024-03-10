import { Config } from "@src/config";
import { FormInput, Session, ValidationResponse } from "@src/types";
import { MenuAction } from "./action.menu";
import { Request, Response } from "@src/types/request";

export abstract class BaseMenu {
  constructor(
    protected readonly request: Request,
    protected readonly response: Response,
  ) { }

  async validate(data?: string): Promise<ValidationResponse> {
    return true;
  }

  abstract message(): Promise<string>;

  abstract nextMenu(): Promise<string | undefined>;

  /**
   * Terminate the current session
   *
   */
  async end(): Promise<boolean> {
    return false;
  }

  get sessionId(): string {
    // FIXME: this is not reliable, add to request object
    return this.request.query?.sessionid!;
  }

  async isStart(): Promise<boolean> {
    return Promise.resolve(false);
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
    };
  }

  async back(): Promise<string | undefined> {
    return undefined;
  }

  abstract actions(): Promise<MenuAction[]>;

  async inputs(): Promise<FormInput[]> {
    return [];
  }

  isForm(): boolean {
    return false;
  }
}
