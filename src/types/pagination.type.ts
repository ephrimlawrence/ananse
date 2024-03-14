import { MenuAction } from "../menus/action.menu"

export interface PaginationItem {
  page: number
  nextPage?: number
  previousPage?: number,
  data: Array<MenuAction>
}
