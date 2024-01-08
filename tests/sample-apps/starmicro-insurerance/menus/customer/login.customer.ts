import { BaseMenu, ValidationResponse } from "../../../../../src/menus";
import { MenuType } from "../../enums";
import { Customer } from "../../models/customer";

export class ClientLogin extends BaseMenu {
  async nextMenu() {
    return MenuType.customer;
  }

  async message() {
    return "Enter PIN";
  }

  async validate(pin?: string | undefined): Promise<ValidationResponse> {
    if (!/\d{4}/.test(pin!)) {
      return "Invalid PIN, must be 4 numbers!";
    }

    const exists = await Customer.exists({
      phone_number: this.request.state.msisdn,
      pin: pin,
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
