import { BaseMenu } from "@src/menus/base.menu";
import { DynamicMenu } from "@src/menus/dynamic_menu.menu";
import { Type } from "@src/types";
import { PaginationItem } from "@src/types/pagination.type";

export const MENU_CACHE: { [menuId: string]: { paginated: boolean, menu: Type<BaseMenu> | DynamicMenu } } =
  {};

export const PAGINATION_CACHE: { [menuId: string]: { [page: number | string]: PaginationItem } } = {}
