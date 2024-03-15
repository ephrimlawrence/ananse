import { BaseMenu, DynamicMenu, Menu, MenuAction } from "../menus";

// export function instantiateMenu(menu: Menu) {
//   if (menuType(menu) == "class") {
//     if (menu instanceof BaseMenu) {
//       return menu;
//     }

//     // @ts-ignore
//     return new menu(this.request, this.response);
//   }

//   return menu;
// }

export function menuType(val: Menu): "class" | "dynamic" {
  // TODO: document why this special case is needed
  if (/^DynamicMenu$/i.test(val.constructor.name)) {
    return "dynamic";
  }
  return "class";
}

export async function getMenuActions(menu: Menu): Promise<MenuAction[]> {
  if (menuType(menu!) == "class") {
    return (await (menu as unknown as BaseMenu).actions()) || [];
  } else {
    return await (menu as DynamicMenu).getActions()
  }
}
