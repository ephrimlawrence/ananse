import { Request } from "@src/interfaces/request";
import { ServerResponse } from "http";

export abstract class BaseAction {
  constructor(
    protected readonly request: Request,
    protected readonly response: ServerResponse
  ) {}

  async validate(): Promise<undefined | boolean> {
    return undefined;
  }

  abstract message(): string;

  defaultNextMenu(): string | undefined {
    return undefined;
  }
}
