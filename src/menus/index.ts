export { MenuAction } from "./action.menu";
export { BaseMenu } from "./base.menu";
export { DynamicMenu } from "./dynamic_menu.menu";
export { ValidationResponse } from "@src/types";

// TODO: Keep list of menus cached in a map, globally
import { Request, Response } from "@src/types/request";
import { Type } from "@src/types";
import { BaseMenu } from "@src/menus/base.menu";
import { DynamicMenu } from "@src/menus";
import { MENU_CACHE } from "@src/core/state.core";

export class Menus {
  private static instance: Menus;

  // private items: { [menuId: string]: Type<BaseMenu> | DynamicMenu } = {};

  private constructor() {}

  public static getInstance(): Menus {
    if (!Menus.instance) {
      Menus.instance = new Menus();
    }

    return Menus.instance;
  }

  name(value: string): DynamicMenu {
    const _menu = new DynamicMenu(value);
    MENU_CACHE[value] = _menu;
    return _menu;
  }

  add(cls: Type<BaseMenu>, name: string): void {
    // const _menu = new cls(cls.name, cls);
    MENU_CACHE[name] = cls;

    // return _menu;
  }

  menu(id: string): DynamicMenu {
    const _menu = new DynamicMenu(id);
    MENU_CACHE[id] = _menu;

    return _menu;
  }

  get menus() {
    return MENU_CACHE;
  }

  getStartMenu(
    req: Request,
    res: Response,
  ): { id: string; obj: DynamicMenu | Type<BaseMenu> } {
    const start = Object.keys(MENU_CACHE).find((id) => {
      const menu = MENU_CACHE[id];
      if (menu instanceof BaseMenu) {
        // @ts-ignore
        return new menu(req, res).isStart;
      }

      return (menu as DynamicMenu).isStart;
    });

    if (start == undefined) {
      throw new Error("No start menu defined. Please define a start menu");
    }

    return { id: start, obj: MENU_CACHE[start] };
  }

  getMenu(id: string): DynamicMenu | Type<BaseMenu> {
    const menu = MENU_CACHE[id];

    if (menu == undefined) {
      throw new Error(`Menu #${id} not found`);
    }

    return menu;
  }
}

export type Menu = Type<BaseMenu> | DynamicMenu;

const MenuRouter = Menus.getInstance();
export default MenuRouter;
