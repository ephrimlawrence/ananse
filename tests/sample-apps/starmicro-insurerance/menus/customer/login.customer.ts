import { BaseMenu, ValidationResponse } from "../../../../../src/menus";
import { Customer } from "../../models/customer";

export class ClientLogin extends BaseMenu {
  async nextMenu() {
    // TODO: redirect to agent menu/customer based on account type
    return undefined;
  }

  async message() {
    return "Enter PIN";
  }

  async validate(data?: string | undefined): Promise<ValidationResponse> {
    // TODO: make api call
    if (!/\d{4}/.test(data!)) {
      return "Invalid PIN, must be 4 numbers!";
    }

    const exists = await Customer.exists({
      phone_number: this.request.state.msisdn,
    });
    if (exists == null) {
      // TODO: add termination of session from here. Possible this.end()
      return "Wrong PIN. Enter PIN";
    }
    return true;
  }

  async actions() {
    return [];
  }
}
