import type { BaseMenu, DynamicMenu, Menu, MenuAction } from "../menus";

export function menuType(val: Menu): "class" | "dynamic" {
	// TODO: document why this special case is needed
	if (/^DynamicMenu$/i.test(val.constructor.name)) {
		return "dynamic";
	}
	return "class";
}

export async function getMenuActions(menu: Menu): Promise<MenuAction[]> {
	if (menuType(menu) === "class") {
		const _baseMenu = menu as unknown as BaseMenu;
		// Extra check to verify if 'actions' function was implemented
		if (typeof _baseMenu.actions === "function") {
			return (await _baseMenu.actions()) || [];
		}
		return [];
	}
	return await (menu as DynamicMenu).getActions();
}
