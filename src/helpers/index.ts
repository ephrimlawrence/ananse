import { BaseMenu, DynamicMenu, Menu, ValidationResponse } from "@src/menus";
import { State } from "@src/models/ussd-state";
import { FormInput } from "@src/types";
import { Request, Response } from "@src/types/request";
import { SupportGateway } from "./constants";

export function menuType(val: Menu): "class" | "dynamic" {
  // TODO: document why this special case is needed
  if (/^DynamicMenu$/i.test(val.constructor.name)) {
    return "dynamic";
  }
  return "class";
}

export function instantiateMenu(menu: Menu) {
  if (menuType(menu) == "class") {
    if (menu instanceof BaseMenu) {
      return menu;
    }

    // @ts-ignore
    return new menu(this.request, this.response);
  }

  return menu;
}

export async function validateInput(opts: {
  state: State;
  menu?: Menu;
  formInput?: FormInput;
  request: Request;
  response: Response;
}): Promise<{ error: string | undefined; valid: boolean }> {
  const { state, menu, formInput: input, request, response } = opts;

  if (menu == null && input == null) {
    throw new Error("Either menu or input must be defined");
  }

  let resp: { error: string | undefined; valid: boolean } = {
    valid: true,
    error: undefined,
  },
    status: ValidationResponse = true;

  if (menu != null) {
    if (menuType(menu) == "class") {
      status = await (menu as unknown as BaseMenu).validate(state?.userData);
    } else {
      status = await (menu as DynamicMenu).validateInput(request, response);
    }
  }

  if (input != null) {
    if (input.validate == null) {
      status = true;
    } else if (typeof input.validate == "function") {
      status = await input.validate(request, response);
    } else {
      try {
        status = (input.validate as RegExp).test(state?.userData);
      } catch (error) { }
    }
  }

  if (typeof status == "string") {
    resp = { valid: false, error: status };
  } else if (typeof status == "boolean" && status == false) {
    resp = { valid: false, error: undefined };
  }

  return resp;
}

export { SupportGateway }
