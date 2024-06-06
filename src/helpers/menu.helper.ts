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
		return (await (menu as unknown as BaseMenu).actions()) || [];
	}
	return await (menu as DynamicMenu).getActions();
}
