import { Menu, MenuOption, Route } from "./router";

export class USSDState {
  network: string;
  sessionId: string;
  mode: "start" | "more" | "end";
  msisdn: string;
  userData: string;
  // currentRoute: Route;
  currentMenu: Menu;
  nextMenu?: Menu | undefined;

  option?: MenuOption;
  nextOption?: { name: string; value: MenuOption } | undefined;

  get isStart(): boolean {
    return this.mode == "start";
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
