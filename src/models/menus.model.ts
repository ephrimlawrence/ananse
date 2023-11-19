// TODO: Keep list of menus cached in a map, globally
import { Request, Response } from "@src/types/request";
// import { BaseMenu } from "./action";
import { Validation, Type, ValidationResponse } from "@src/types";
// TODO: rename to action

export class MenuAction {
  name: string; // FIXME: relevant? should be removed?

  /**
   * The choice that the user should enter to select this option
   * '*' is used to match any input. Useful for a catch-all option, must be the last option
   */
  choice:
    | string
    | RegExp
    | ((
        input: string | undefined,
        req: Request,
        res: Response
      ) => Promise<string>); // TODO: or function
  //FIXME: remove this
  // route: string; // Route ID
  // TODO: change return type to response
  // TODO: or link to action class
  // action?: Type<BaseAction>;
  display?:
    | string
    | ((req: Request, res: Response) => Promise<string> | string); // text to display. or function? text?
  // validation?: string | RegExp | ((req: Request) => boolean); //FIXME: move to action class
  // error_message?: string;
  next_menu?: string | ((req: Request, resp: Response) => Promise<string>); // TODO: links to next menu

  // TODO: validate that either route or action is provided
}

export class DynamicMenu {
  // TODO: Look for better class name

  private _id: string;
  private _validation?: Validation;
  private _actions: MenuAction[];
  private _back?: string; // TODO: links to previous menu/action
  private _isStart: boolean = false;
  private _currentOption?: MenuAction | undefined = undefined; // make private??
  private _action?: Type<BaseMenu> | undefined = undefined;
  private _message?:
    | string
    | ((req: Request, res: Response) => Promise<string> | string) = undefined;
  private _nextMenu?:
    | string
    | ((req: Request, res: Response) => Promise<string> | string) = undefined;

  constructor(id: string, action?: Type<BaseMenu>) {
    this._id = id;
    this._action = action;
  }

  defaultNextMenu(
    menu: string | ((req: Request, res: Response) => Promise<string> | string)
  ): DynamicMenu {
    this._nextMenu = menu;
    return this;
  }

  actions(items: MenuAction[]): DynamicMenu {
    if (this._action != undefined) {
      throw new Error(
        "Cannot set options for a menu with an action. Menu #${this._id} has an action defined"
      );
    }

    this._actions = items;

    return this;
  }

  back(menuName: string): DynamicMenu {
    this._back = menuName;

    return this;
  }

  start(): DynamicMenu {
    // TODO: verify that only one start menu is defined. Move to Route class?
    this._isStart = true;

    return this;
  }

  validation(val: Validation) {
    // if (this._validation != null) {
    //   throw Error(
    //     `Menu #${this._id} already has a validation function defined!`
    //   );
    // }

    this._validation = val;
    return this;
  }

  message(msg: string | ((req: Request, res: Response) => Promise<string>)) {
    this._message = msg;
    return this;
  }

  // TODO: rename to getactiona
  getActions(): MenuAction[] {
    return this._actions || [];
  }

  async getMessage(req: Request, res: Response): Promise<string> {
    if (typeof this._message == "function") {
      return this._message(req, res);
    }
    return this._message || "";
  }

  async getDefaultNextMenu(
    req: Request,
    res: Response
  ): Promise<string | undefined> {
    if (typeof this._nextMenu == "function") {
      return this._nextMenu(req, res);
    }
    return this._nextMenu;
  }

  async validateInput(
    req: Request,
    res: Response
  ): Promise<ValidationResponse> {
    if (this._validation == null) {
      return true;
    }

    if (typeof this._validation == "function") {
      return this._validation(req, res);
    }

    try {
      return this._validation.test(req.state.userData);
    } catch {}

    return false;
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

  set currentOption(value: MenuAction | undefined) {
    this._currentOption = value;
  }

  get currentOption(): MenuAction | undefined {
    return this._currentOption;
  }
}

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

export abstract class BaseMenu {
  constructor(
    protected readonly request: Request,
    protected readonly response: Response
  ) {}

  async validate(data?: string): Promise<ValidationResponse> {
    return true;
  }

  abstract message(): Promise<string>;

  abstract nextMenu(): Promise<string | undefined>;

  get isStart(): Promise<boolean> {
    return Promise.resolve(false);
  }

  async back(): Promise<string | undefined> {
    return undefined;
  }

  abstract actions(): Promise<MenuAction[]>;
}

export type Menu = Type<BaseMenu> | DynamicMenu;

const router = Menus.getInstance();
export default router;

// const test = Route.
