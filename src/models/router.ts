// // TODO: Keep list of menus cached in a map, globally
// import { Type } from "@src/types";
// import { Request, Response } from "@src/types/request";
// import { BaseMenu } from "./menus.model";

// export class MenuOption {
//   name: string;
//   choice: string; // TODO: or function //FIXME: remove this
//   // route: string; // Route ID
//   // TODO: change return type to response
//   // TODO: or link to menus.model class
//   action?: Type<BaseMenu>;
//   display?: string; // text to display. or function? text?
//   validation?: string | RegExp | ((req: Request) => boolean); //FIXME: move to action class
//   error_message?: string;
//   next_menu?: string | ((req: Request, resp: Response) => string); // TODO: links to next menu

//   // TODO: validate that either route or action is provided
// }

// export class Menu {
//   private _id: string;
//   private _options: MenuOption[];
//   private _back?: string; // TODO: links to previous menu/action
//   private _isStart: boolean = false;
//   private _currentOption?: MenuOption | undefined = undefined; // make private??
//   private _action?: Type<BaseMenu> | undefined = undefined;

//   constructor(id: string, action?: Type<BaseMenu>) {
//     this._id = id;
//     this._action = action;
//   }

//   options(items: MenuOption[]): Menu {
//     if (this._action != undefined) {
//       throw new Error(
//         "Cannot set options for a menu with an action. Menu #${this._id} has an action defined"
//       );
//     }

//     this._options = items;

//     return this;
//   }

//   back(id: string): Menu {
//     this._back = id;

//     return this;
//   }

//   start(): Menu {
//     // TODO: verify that only one start menu is defined. Move to Route class?
//     this._isStart = true;

//     return this;
//   }

//   getOptions(): MenuOption[] {
//     return this._options || [];
//   }

//   get action() {
//     return this._action;
//   }

//   get id(): string {
//     return this._id;
//   }

//   get isStart(): boolean {
//     return this._isStart || false;
//   }

//   set currentOption(value: MenuOption | undefined) {
//     this._currentOption = value;
//   }

//   get currentOption(): MenuOption | undefined {
//     return this._currentOption;
//   }
// }

// export class Route {
//   private static instance: Route;

//   private _menus: Record<string, Menu> = {};

//   private constructor() {}

//   public static getInstance(): Route {
//     if (!Route.instance) {
//       Route.instance = new Route();
//     }

//     return Route.instance;
//   }

//   menu(id: string) {
//     const _menu = new Menu(id);
//     this._menus[id] = _menu;

//     return _menu;
//   }

//   get menus() {
//     return this._menus;
//   }

//   get startMenu(): Menu {
//     const start = Object.values(this._menus).find((menu) => menu.isStart);

//     if (start == undefined) {
//       throw new Error("No start menu defined. Please define a start menu");
//     }

//     return start;
//   }

//   getMenu(id: string): Menu {
//     const menu = this._menus[id];

//     if (menu == undefined) {
//       throw new Error(`Menu #${id} not found`);
//     }

//     return menu;
//   }
//   // readonly getRoute(){

//   // }
//   // get routes(): Record<string, Route> {
//   //   return this._menus;
//   // }

//   // set routes(value: Record<string, Route>) {
//   //   this._menus = value;
//   // }

//   // addRoute(id: string, router: Route): void {
//   //   this.routes[id] = router;
//   // }
// }

// const router = Route.getInstance();
// export default router;

// // const test = Route.
