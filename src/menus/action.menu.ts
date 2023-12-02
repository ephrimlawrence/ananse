import { Request, Response } from "@src/types/request";

export class MenuAction {
  name: string; // FIXME: relevant? should be removed?

  /**
   * The choice that the user should enter to select this option
   * '*' is used to match any input. Useful for a catch-all option, must be the last option
   */
  choice:
    | string
    | RegExp
    | ((
        input: string | undefined,
        req: Request,
        res: Response
      ) => Promise<string>); // TODO: or function
  //FIXME: remove this
  // route: string; // Route ID
  // TODO: change return type to response
  // TODO: or link to action class
  // action?: Type<BaseAction>;
  display?:
    | string
    | ((req: Request, res: Response) => Promise<string> | string); // text to display. or function? text?
  // validation?: string | RegExp | ((req: Request) => boolean); //FIXME: move to action class
  // error_message?: string;
  next_menu?: string | ((req: Request, resp: Response) => Promise<string>); // TODO: links to next menu

  // TODO: validate that either route or action is provided
}
