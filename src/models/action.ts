import { Request } from "@src/interfaces/request";
import { ServerResponse } from "http";
import { MenuOption } from "./router";

export abstract class BaseAction {
  constructor(
    protected readonly request: Request,
    protected readonly response: ServerResponse
  ) {}

  async validate(data?: string): Promise<boolean> {
    return true;
  }

  abstract message(): string;

  defaultNextMenu(): string | undefined {
    return undefined;
  }

  actions(): MenuOption[] {
    return [];
  }
}
