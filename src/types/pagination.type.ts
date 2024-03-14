import { MenuAction } from "../menus/action.menu"

export interface PaginationItem {
  page: number
  nextPage: PaginationItem | undefined
  previousPage: PaginationItem | undefined
  data: Array<MenuAction>
}
