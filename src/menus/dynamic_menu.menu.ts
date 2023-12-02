import { Type, Validation, ValidationResponse } from "@src/types";
import { MenuAction } from "./action.menu";
import { BaseMenu } from "./base.menu";
import { Request, Response } from "@src/types/request";

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
