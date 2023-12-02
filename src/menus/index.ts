export { MenuAction } from "./action.menu";
export { BaseMenu } from "./base.menu";
export { DynamicMenu } from "./dynamic_menu.menu";

// TODO: Keep list of menus cached in a map, globally
import { Request, Response } from "@src/types/request";
import { Type } from "@src/types";
import { BaseMenu } from "@src/menus/base.menu";
import { DynamicMenu } from "@src/menus";

export class Menus {
  private static instance: Menus;

  private items: Record<string, Type<BaseMenu> | DynamicMenu> = {};

  private constructor() {}

  public static getInstance(): Menus {
    if (!Menus.instance) {
      Menus.instance = new Menus();
    }

    return Menus.instance;
  }

  name(value: string): DynamicMenu {
    const _menu = new DynamicMenu(value);
    this.items[value] = _menu;
    return _menu;
  }

  add(cls: Type<BaseMenu>, name: string): void {
    // const _menu = new cls(cls.name, cls);
    this.items[name] = cls;

    // return _menu;
  }

  menu(id: string) {
    const _menu = new DynamicMenu(id);
    this.items[id] = _menu;

    return _menu;
  }

  get menus() {
    return this.items;
  }

  getStartMenu(req: Request, res: Response): DynamicMenu | Type<BaseMenu> {
    const start = Object.values(this.items).find((menu) => {
      if (menu instanceof BaseMenu) {
        // @ts-ignore
        return new menu(req, res).isStart;
      }

      return (menu as DynamicMenu).isStart;
    });

    if (start == undefined) {
      throw new Error("No start menu defined. Please define a start menu");
    }

    return start;
  }

  getMenu(id: string): DynamicMenu | Type<BaseMenu> {
    const menu = this.items[id];

    if (menu == undefined) {
      throw new Error(`Menu #${id} not found`);
    }

    return menu;
  }
}

export type Menu = Type<BaseMenu> | DynamicMenu;

const router = Menus.getInstance();
export default router;
