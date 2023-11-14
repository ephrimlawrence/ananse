export abstract class BaseAction {
  constructor() {}

  async validate(): Promise<undefined | boolean> {
    return undefined;
  }

  abstract message(): string;

  defaultNextMenu(): string | undefined {
    return undefined;
  }
}
