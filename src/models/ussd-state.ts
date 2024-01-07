import { Menu, MenuAction } from "../menus";

export class State {
  private _menu: string; //TODO: use menue id/name instead of class
  private _previousMenu?: string | undefined = undefined;

  // private _trackedMenus: {previous: string, current: string}[] = [];
  // network: string;
  sessionId: string;
  mode: "start" | "more" | "end";
  msisdn: string;
  userData: string;
  nextMenu?: string | undefined;
  action?: MenuAction | undefined;
  previous?: State | undefined;
  // formInputId?: string | undefined;
  form?:
    | {
        id: string;
        /**
         * @deprecated Use submittedInputs instead
         */
        currentInput: string | undefined;

        /**
         * Tracks submitted inputs. Key is the input name, and value must be `true`.
         * If an input is submitted, it is added to this object.
         * If the input is revisited, it is first removed from this object and
         * then added back when it is submitted again.
         *
         */
        submitted: Record<string, true>; // Can be array but a map for O(1) lookup
        nextInput: string | undefined;
        // TODO: track submitted inputs
      }
    | undefined;

  get isStart(): boolean {
    return this.mode == "start";
  }

  get isEnd(): boolean {
    return this.mode == "end";
  }

  set menu(val: string) {
    this._previousMenu = this._menu;
    this._menu = val;
  }

  get menu(): string {
    return this._menu;
  }

  get previousMenu(): string | undefined {
    return this._previousMenu;
  }

  set previousMenu(val: string | undefined) {
    this._previousMenu = val;
  }

  /**
   * Sets mode to "end"
   */
  end(): void {
    this.mode = "end";
  }

  static fromJSON(json: Record<string, any>): State {
    return Object.assign(new State(), json);
    // state.sessionId = json.sessionId;
    // state.mode = json.mode;
    // state.msisdn = json.msisdn;
    // state.userData = json.userData;
    // state.nextMenu = json.nextMenu;
    // state.action = json.action;
    // state.previous = json.previous;

    // return state;
  }

  toJSON(): Record<string, any> {
    return {
      sessionId: this.sessionId,
      mode: this.mode,
      msisdn: this.msisdn,
      userData: this.userData,
      nextMenu: this.nextMenu,
      previousMenu: this.previousMenu,
      menu: this.menu,
      action: this.action,
      previous: this.previous?.toJSON(),
      // formInputId: this.formInputId,
      form: this.form,
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
