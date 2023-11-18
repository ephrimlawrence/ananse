import { Request, Response } from "@src/interfaces/request";
import { MenuOption } from "./router";

// TODO: rename to menu
export abstract class BaseAction {
  constructor(
    protected readonly request: Request,
    protected readonly response: Response
  ) {}

  async validate(data?: string): Promise<boolean> {
    return true;
  }

  abstract message(): string;

  abstract nextMenu(): string | undefined;

  actions(): MenuOption[] {
    return [];
  }
}
