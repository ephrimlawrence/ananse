// TODO: Keep list of menus cached in a map, globally
import { Action } from "@src/interfaces/action.interface";
import { Request } from "@src/interfaces/request";
import { Action } from "./action";

class MenuOption {
  choice: string; // TODO: or function
  // route: string; // Route ID
  // TODO: change return type to response
  // TODO: or link to action class
  action?: Action<Action>;
  display?: string; // text to display
  validation?: string | RegExp | ((req: Request) => boolean);
  error_message?: string;
  next_menu?: string | ((req: Request, resp: any) => any); // TODO: links to next menu

  // TODO: validate that either route or action is provided
}

export class Menu {
  private id: string;
  private _options: MenuOption[];
  private _back?: string; // TODO: links to previous menu/action

  private _currentOption?: MenuOption | undefined = undefined; // make private??

  constructor(id: string) {
    this.id = id;
  }

  options(items: MenuOption[]): Menu {
    this._options = items;

    return this;
  }

  back(id: string): Menu {
    this._back = id;

    return this;
  }

  set currentOption(value: MenuOption | undefined) {
    this._currentOption = value;
  }

  get currentOption(): MenuOption | undefined {
    return this._currentOption;
  }
}

export class Route {
  private static instance: Route;

  private _menus: Record<string, Menu> = {};

  private constructor() {}

  public static getInstance(): Route {
    if (!Route.instance) {
      Route.instance = new Route();
    }

    return Route.instance;
  }

  menu(id: string) {
    const _menu = new Menu(id);
    this._menus[id] = _menu;

    return _menu;
  }

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

const router = Route.getInstance();
export default router;

// const test = Route.
