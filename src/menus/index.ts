export { MenuAction } from "./action.menu";
export { BaseMenu } from "./base.menu";
export { DynamicMenu } from "./dynamic_menu.menu";
export { ValidationResponse } from "@src/types";

import { Request, Response } from "@src/types/request";
import { Type } from "@src/types";
import { BaseMenu } from "@src/menus/base.menu";
import { DynamicMenu } from "@src/menus";
import { MENU_CACHE } from "@src/models";
import { menuType } from "..";

export class Menus {
  private static instance: Menus;

  // private items: { [menuId: string]: Type<BaseMenu> | DynamicMenu } = {};

  private constructor() { }

  public static getInstance(): Menus {
    if (!Menus.instance) {
      Menus.instance = new Menus();
    }

    return Menus.instance;
  }

  add(cls: Type<BaseMenu>, name: string): void {
    MENU_CACHE[name] = { menu: cls, paginated: false };
  }

  menu(id: string): DynamicMenu {
    const _menu = new DynamicMenu(id);
    MENU_CACHE[id] = { menu: _menu, paginated: false };

    return _menu;
  }

  get menus() {
    return MENU_CACHE;
  }

  async getStartMenu(
    req: Request,
    res: Response,
  ): Promise<{ id: string; obj: DynamicMenu | Type<BaseMenu>; }> {
    let startId: string | undefined;

    for (const id in MENU_CACHE) {
      let isStart = false;
      const menu = MENU_CACHE[id]?.menu;

      if (menuType(menu) == "class") {
        if (menu instanceof BaseMenu) {
          isStart = await menu.isStart()
        } else {
          // @ts-ignore
          isStart = (await new menu(req, res).isStart)
        }
      } else {

        isStart = (menu as DynamicMenu).isStart
      }

      if (isStart) {
        startId = id;
        break;
      }
    }

    // console.log(start, MENU_CACHE)
    if (startId == undefined) {
      throw new Error("No start menu defined. Please define a start menu");
    }

    return { id: startId, obj: MENU_CACHE[startId]?.menu };
  }

  getMenu(id: string): DynamicMenu | Type<BaseMenu> {
    const menu = MENU_CACHE[id]?.menu;

    if (menu == undefined) {
      throw new Error(`Menu #${id} not found`);
    }

    return menu;
  }
}

export type Menu = Type<BaseMenu> | DynamicMenu;

export const MenuRouter = Menus.getInstance();
