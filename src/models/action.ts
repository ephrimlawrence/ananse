// import { Request, Response } from "@src/types/request";
// import { MenuOption } from "./router";
// import { ValidationResponse } from "@src/types";

// // TODO: rename to menu
// export abstract class BaseMenu {
//   constructor(
//     protected readonly request: Request,
//     protected readonly response: Response
//   ) {}

//   async validate(data?: string): Promise<ValidationResponse> {
//     return true;
//   }

//   abstract message(): string;

//   abstract nextMenu(): string | undefined;

//   get isStart(): boolean {
//     return false;
//   }

//   actions(): MenuOption[] {
//     return [];
//   }
// }
