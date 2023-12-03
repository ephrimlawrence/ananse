import { Menu, MenuAction } from "../menus";

export class State {
  private _menu: Menu;
  private _previousMenu?: Menu | undefined = undefined;

  // private _trackedMenus: {previous: string, current: string}[] = [];
  // network: string;
  sessionId: string;
  mode: "start" | "more" | "end";
  msisdn: string;
  userData: string;
  nextMenu?: string | undefined;
  action?: MenuAction | undefined;
  previous?: State | undefined;

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

  static fromJSON(json: Record<string, any>): State {
    const state = new State();

    state.sessionId = json.sessionId;
    state.mode = json.mode;
    state.msisdn = json.msisdn;
    state.userData = json.userData;
    state.nextMenu = json.nextMenu;
    state.action = json.action;
    state.previous = json.previous;

    return state;
  }

  toJSON(): Record<string, any> {
    return {
      sessionId: this.sessionId,
      mode: this.mode,
      msisdn: this.msisdn,
      userData: this.userData,
      nextMenu: this.nextMenu,
      action: this.action,
      previous: this.previous?.toJSON(),
    };
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
