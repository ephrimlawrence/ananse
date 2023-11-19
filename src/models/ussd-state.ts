import { Menu, MenuAction } from "./menus.model";

export class State {
  private _menu: Menu;
  private _previousMenu?: Menu | undefined = undefined;

  // private _trackedMenus: {previous: string, current: string}[] = [];
  // network: string;
  sessionId: string;
  mode: "start" | "more" | "end";
  msisdn: string;
  userData: string;
  // currentRoute: Route;

  nextMenu?: string | undefined;

  action?: MenuAction | undefined;
  previous?: State | undefined;
  // sessionData: Record<string, any> = {};

  get isStart(): boolean {
    return this.mode === "start";
  }

  get isEnd(): boolean {
    return this.mode === "end";
  }

  set menu(val: Menu) {
    this._previousMenu = this._menu;
    this._menu = val;
  }

  get menu(): Menu {
    return this._menu;
  }

  get previousMenu(): Menu | undefined {
    return this._previousMenu;
  }
  // other?: string;

  // constructor(opts: USSDState) {
  //   this.network = opts.network;
  //   this.sessionId = opts.sessionId;
  //   this.mode = opts.mode;
  //   this.msisdn = opts.msisdn;
  //   this.userData = opts.userData;
  //   this.currentRoute = opts.currentRoute;
  //   this.currentMenu = opts.currentMenu;
  // }
}
