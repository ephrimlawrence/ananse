import { FormInput, Request, Response, Type, Validation, ValidationResponse } from "@src/types";
import { MenuAction } from "./action.menu";
import { BaseMenu } from "./base.menu";

export class DynamicMenu {
  // TODO: Look for better class name

  #id: string;
  #formInputs: FormInput[] = [];
  #isForm: boolean = false;
  #end: boolean = false;
  #paginate: boolean = false;

  private _validation?: Validation;
  private _actions: MenuAction[];
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
    this.#id = id;
    this._action = action;
  }

  isForm(): DynamicMenu {
    this.#isForm = true;
    return this;
  }

  defaultNextMenu(
    menu: string | ((req: Request, res: Response) => Promise<string> | string),
  ): DynamicMenu {
    this._nextMenu = menu;
    return this;
  }

  actions(items: MenuAction[]): DynamicMenu {
    if (this._action != undefined) {
      throw new Error(
        "Cannot set options for a menu with an action. Menu #${this._id} has an action defined",
      );
    }

    this._actions = items;

    return this;
  }

  inputs(items: FormInput[]): DynamicMenu {
    this.#formInputs ??= [];
    this.#formInputs = [...this.#formInputs, ...items];

    if (this.#formInputs.length == 0) {
      throw new Error(`Form menu #${this.id} must have at least one input!`);
    }
    return this;
  }


  start(): DynamicMenu {
    // TODO: verify that only one start menu is defined. Move to Route class?
    this._isStart = true;

    return this;
  }

  validation(val: Validation) {
    this._validation = val;
    return this;
  }

  message(msg: string | ((req: Request, res: Response) => Promise<string>)) {
    this._message = msg;
    return this;
  }

  paginate() {
    this.#paginate = true
    return this;
  }

  /**
   * Terminate the current session
   */
  end(): void {
    this.#end = true;
  }

  // TODO: rename to getactiona
  getActions(): MenuAction[] {
    return this._actions || [];
  }

  getInputs(): FormInput[] {
    return this.#formInputs || [];
  }

  async getMessage(req: Request, res: Response): Promise<string> {
    if (typeof this._message == "function") {
      return this._message(req, res);
    }
    return this._message || "";
  }

  async getDefaultNextMenu(
    req: Request,
    res: Response,
  ): Promise<string | undefined> {
    if (typeof this._nextMenu == "function") {
      return this._nextMenu(req, res);
    }
    return this._nextMenu;
  }

  async validateInput(
    req: Request,
    res: Response,
  ): Promise<ValidationResponse> {
    if (this._validation == null) {
      return true;
    }

    if (typeof this._validation == "function") {
      return this._validation(req, res);
    }

    try {
      return this._validation.test(req.state.userData);
    } catch { }

    return false;
  }

  /**
   * Whether the current menu is a form menu or not.
   * Not to be confused with `isForm` which is used to set a menu as a form menu.
   *
   * **NOTE**: This is for internal use only!
   */
  get isFormMenu(): boolean {
    return this.#isForm;
  }

  get action() {
    return this._action;
  }

  get id(): string {
    return this.#id;
  }

  get isEnd(): boolean {
    return this.#end;
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

  get isPaginate(): boolean {
    return this.#paginate;
  }
}
