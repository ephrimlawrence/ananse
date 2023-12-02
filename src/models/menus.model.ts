// TODO: Keep list of menus cached in a map, globally
import { Request, Response } from "@src/types/request";
// import { BaseMenu } from "./action";
import { Validation, Type, ValidationResponse } from "@src/types";
import { BaseMenu } from "@src/menus/base.menu";
import { DynamicMenu, MenuAction } from "@src/menus";
// TODO: rename to action

// export class MenuAction {
//   name: string; // FIXME: relevant? should be removed?

//   /**
//    * The choice that the user should enter to select this option
//    * '*' is used to match any input. Useful for a catch-all option, must be the last option
//    */
//   choice:
//     | string
//     | RegExp
//     | ((
//         input: string | undefined,
//         req: Request,
//         res: Response
//       ) => Promise<string>); // TODO: or function
//   //FIXME: remove this
//   // route: string; // Route ID
//   // TODO: change return type to response
//   // TODO: or link to action class
//   // action?: Type<BaseAction>;
//   display?:
//     | string
//     | ((req: Request, res: Response) => Promise<string> | string); // text to display. or function? text?
//   // validation?: string | RegExp | ((req: Request) => boolean); //FIXME: move to action class
//   // error_message?: string;
//   next_menu?: string | ((req: Request, resp: Response) => Promise<string>); // TODO: links to next menu

//   // TODO: validate that either route or action is provided
// }


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

// export abstract class BaseMenu {
//   constructor(
//     protected readonly request: Request,
//     protected readonly response: Response
//   ) {}

//   async validate(data?: string): Promise<ValidationResponse> {
//     return true;
//   }

//   abstract message(): Promise<string>;

//   abstract nextMenu(): Promise<string | undefined>;

//   get isStart(): Promise<boolean> {
//     return Promise.resolve(false);
//   }

//   async back(): Promise<string | undefined> {
//     return undefined;
//   }

//   abstract actions(): Promise<MenuAction[]>;
// }

export type Menu = Type<BaseMenu> | DynamicMenu;

const router = Menus.getInstance();
export default router;

// const test = Route.
