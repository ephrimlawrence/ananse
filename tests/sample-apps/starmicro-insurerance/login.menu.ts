import { BaseMenu, ValidationResponse } from "../../../src/menus";

export class AccountLogin extends BaseMenu {
  async nextMenu() {
    // TODO: redirect to agent menu/customer based on account type
    return undefined;
  }

  async message() {
    return "Enter PIN";
  }

  async validate(data?: string | undefined): Promise<ValidationResponse> {
    // TODO: make api call
    return /\d{4,}/.test(data!);
  }

  async actions() {
    return [];
  }
}
