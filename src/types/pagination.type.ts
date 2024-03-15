import { MenuAction } from "../menus/action.menu"

export interface PaginationItem {
  page: number
  nextPage: number | undefined
  previousPage: number | undefined
  data: Array<MenuAction>
}
