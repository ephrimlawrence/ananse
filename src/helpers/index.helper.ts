import { BaseMenu, DynamicMenu, Menu, ValidationResponse } from "@src/menus";
import { State } from "@src/models/ussd-state";
import { Request, Response } from "@src/types/request";

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

export async function validateInput(
  state: State,
  menu: Menu,
  request: Request,
  response: Response
): Promise<{ error: string | undefined; valid: boolean }> {
  let resp: { error: string | undefined; valid: boolean } = {
      valid: true,
      error: undefined,
    },
    status: ValidationResponse = true;

  if (menuType(menu) == "class") {
    status = await (menu as unknown as BaseMenu).validate(state?.userData);
  } else {
    status = await (menu as DynamicMenu).validateInput(request, response);
  }

  if (typeof status == "string") {
    resp = { valid: false, error: status };
  } else if (typeof status == "boolean" && status == false) {
    resp = { valid: false, error: undefined };
  }

  return resp;
}
