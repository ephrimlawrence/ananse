import { FormInput, NextMenu, PaginationOption, Type, ValidationResponse } from "@src/types";
import { Request, Response } from "@src/types/request";
import { State } from "@src/models";
import { MenuRouter, DynamicMenu, Menu, Menus } from "@src/menus";
import { Config, ConfigOptions } from "@src/config";
import { BaseMenu, MenuAction } from "@src/menus";
import { buildUserResponse, menuType, validateInput } from "@src/helpers";
import { PaginationItem } from "@src/types/pagination.type";
import { MAXIMUM_CHARACTERS } from "@src/helpers/constants";

// TODO: change to project name
export class PaginationHandler {
  constructor(
    private readonly request: Request,
    private readonly response: Response,
    private readonly menu: Menu,
    private readonly menuId: string,
  ) { }

  get state(): State {
    return this.request.state;
  }

  async handle() {
    let actions: MenuAction[] = []

    if (menuType(this.menu!) == "class") {
      actions = (await (this.menu as unknown as BaseMenu).actions()) || [];
    } else {
      actions = await (this.menu as DynamicMenu).getActions()
    }

    const pagination = await this.generatePaginationItems({
      actions: actions,
      item: undefined,
      menu: this.menu,
      unpaginatedActions: [],
      page: 1
    })

    if (pagination != null) {
      this.state.pagination ??= {}
      this.state.pagination[this.menuId] = this.goToFirstPage(pagination)
    }
  }

  private async generatePaginationItems(opts: {
    menu: Menu,
    item: PaginationItem | undefined,
    actions: MenuAction[],
    unpaginatedActions: MenuAction[],
    page: number
  }): Promise<PaginationItem | undefined> {
    // Pagination item is null when starting
    const isStart = opts.item == null;

    const { actions } = opts;

    let message = await buildUserResponse({
      state: this.state,
      errorMessage: undefined,
      request: this.request,
      response: this.response,
      menu: opts.menu,
      actions: actions
    })

    // No more actions, return pagination tree
    if (actions.length == 0) {
      return opts.item
    }

    // If pagination is enabled but its not necessary, return response as usual
    // if (message.length <= MAXIMUM_CHARACTERS && isStart) {
    //   return opts.item;
    // }

    // Add navigation options to message and compute characters length
    message += this.buildNavigationAction(isStart);
    const charactersCount = message.length;

    // If the max characters is exceeded, remove last action item and
    // re-generate the message
    if (charactersCount > MAXIMUM_CHARACTERS) {
      const temp = [...opts.actions]
      opts.unpaginatedActions.push(temp.pop()!)

      return this.generatePaginationItems({
        menu: opts.menu,
        actions: temp,
        unpaginatedActions: opts.unpaginatedActions,
        item: opts.item,
        page: opts.page
      })
    }

    // Add nav actions to pagination items, and link object to prev/next page
    const conf = PaginationHandler.paginationConfig;
    if (!isStart) {
      actions.push({
        choice: conf.previousPage.choice,
        display: conf.previousPage.display,
        next_menu: this.menuId
      })
    }
    if (opts.unpaginatedActions.length > 0) {
      actions.push({
        choice: conf.nextPage.choice,
        display: conf.nextPage.display,
        next_menu: this.menuId
      })
    }

    let paginationItem: PaginationItem = {
      page: opts.page,
      nextPage: undefined,
      previousPage: undefined,
      data: [...actions]
    };

    if (opts.item != null) {
      opts.item.nextPage = {...paginationItem}
      paginationItem.previousPage = { ...opts.item }
    }

    // Reset actions to unpaginated items
    const temp = [...opts.unpaginatedActions];
    opts.unpaginatedActions = []

    return this.generatePaginationItems({
      menu: opts.menu,
      actions: temp,
      unpaginatedActions: opts.unpaginatedActions,
      item: paginationItem,
      page: opts.page + 1
    })
  }

  private buildNavigationAction(isStart: boolean = false) {
    const conf = PaginationHandler.paginationConfig;

    if (isStart) {
      return "\n" + conf.nextPage.display
    }

    return `\n${conf.previousPage.display}\n${conf.nextPage.display}`
  }

  goToFirstPage(item: PaginationItem): PaginationItem {
    if (item.previousPage != null && item.page != 1) {
      return this.goToFirstPage(item.previousPage)
    }

    return item;
  }

  static get paginationConfig() {
    return Config.getInstance().options.pagination ?? new PaginationOption();
  }

  static isNavActionSelected(input?: string): boolean {
    if (input == null) {
      return false
    }

    const options = [
      this.paginationConfig.previousPage?.choice?.trim(),
      this.paginationConfig.nextPage?.choice?.trim(),
    ]

    return options.includes(input?.trim())
  }

  static shouldGoToNextPage(input?: string): boolean {
    if (input == null) {
      return false
    }

    return input.trim() == this.paginationConfig.nextPage?.choice?.trim()
  }

  static shouldGoToPreviousPage(input?: string): boolean {
    if (input == null) {
      return false
    }

    return input.trim() == this.paginationConfig.previousPage?.choice?.trim()
  }


}
