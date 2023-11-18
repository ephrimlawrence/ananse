// TODO: Keep list of menus cached in a map, globally
import { Request, Response } from "@src/types/request";
import { BaseAction } from "./action";
import { Validation, Type } from "@src/types";
// TODO: rename to action
export class MenuOption {
  name: string;
  choice?: string | RegExp | ((req: Request, res: Response) => string); // TODO: or function //FIXME: remove this
  // route: string; // Route ID
  // TODO: change return type to response
  // TODO: or link to action class
  // action?: Type<BaseAction>;
  display?: string; // text to display. or function? text?
  // validation?: string | RegExp | ((req: Request) => boolean); //FIXME: move to action class
  // error_message?: string;
  next_menu?: string | ((req: Request, resp: Response) => string); // TODO: links to next menu

  // TODO: validate that either route or action is provided
}

export class DynamicMenu {
  // TODO: Look for better class name

  private _id: string;
  private _validation?: Validation;
  private _actions: MenuOption[];
  private _back?: string; // TODO: links to previous menu/action
  private _isStart: boolean = false;
  private _currentOption?: MenuOption | undefined = undefined; // make private??
  private _action?: Type<BaseAction> | undefined = undefined;

  constructor(id: string, action?: Type<BaseAction>) {
    this._id = id;
    this._action = action;
  }

  options(items: MenuOption[]): DynamicMenu {
    if (this._action != undefined) {
      throw new Error(
        "Cannot set options for a menu with an action. Menu #${this._id} has an action defined"
      );
    }

    this._actions = items;

    return this;
  }

  back(id: string): DynamicMenu {
    this._back = id;

    return this;
  }

  start(): DynamicMenu {
    // TODO: verify that only one start menu is defined. Move to Route class?
    this._isStart = true;

    return this;
  }

  validation(val: Validation) {
    if (this._validation != null) {
      throw Error(
        `Menu #${this._id} already has a validation function defined!`
      );
    }

    this._validation = val;
    return this;
  }

  getOptions(): MenuOption[] {
    return this._actions || [];
  }

  get action() {
    return this._action;
  }

  get id(): string {
    return this._id;
  }

  get isStart(): boolean {
    return this._isStart || false;
  }

  set currentOption(value: MenuOption | undefined) {
    this._currentOption = value;
  }

  get currentOption(): MenuOption | undefined {
    return this._currentOption;
  }
}

export class Menus {
  private static instance: Menus;

  private items: Record<string, Type<BaseAction> | DynamicMenu> = {};

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

  add(cls: Type<BaseAction>, name: string): void {
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

  getStartMenu(req: Request, res: Response): DynamicMenu | Type<BaseAction> {
    const start = Object.values(this.items).find((menu) => {
      if (menu instanceof BaseAction) {
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

  getMenu(id: string): DynamicMenu | Type<BaseAction> {
    const menu = this.items[id];

    if (menu == undefined) {
      throw new Error(`Menu #${id} not found`);
    }

    return menu;
  }
  // readonly getRoute(){

  // }
  // get routes(): Record<string, Route> {
  //   return this._menus;
  // }

  // set routes(value: Record<string, Route>) {
  //   this._menus = value;
  // }

  // addRoute(id: string, router: Route): void {
  //   this.routes[id] = router;
  // }
}

const router = Menus.getInstance();
export default router;

// const test = Route.
