import { BaseMenu } from "@src/menus/base.menu";
import { DynamicMenu } from "@src/menus/dynamic_menu.menu";
import { Type } from "@src/types";

export const  MENU_CACHE: { [menuId: string]: Type<BaseMenu> | DynamicMenu } = {};
