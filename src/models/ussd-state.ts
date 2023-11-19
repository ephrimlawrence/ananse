import { Menu, MenuAction } from "./menus.model";

export class State {
  // private _trackedMenus: {previous: string, current: string}[] = [];
  // network: string;
  sessionId: string;
  mode: "start" | "more" | "end";
  msisdn: string;
  userData: string;
  // currentRoute: Route;
  menu: Menu;
  nextMenu?: string | undefined;

  action?: MenuAction;
  previous?: State | undefined;
  // sessionData: Record<string, any> = {};

  get isStart(): boolean {
    return this.mode === "start";
  }

  get isEnd(): boolean {
    return this.mode === "end";
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
