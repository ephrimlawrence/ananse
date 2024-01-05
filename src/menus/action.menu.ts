import { BaseSession } from "@src/sessions";
import { Session } from "@src/types";
import { Request, Response } from "@src/types/request";

export class MenuAction {
  // name: string; // FIXME: relevant? should be removed?

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
  // suggest a name for a method that will be called when this option is selected by the user
  handler: (req: Request, session: BaseSession) => Promise<void>;
  // handler: (get: () => void, set: (val: any) => Promise<void>) => void = (
  //   get,
  //   set
  // ) => {
  //   return;
  // };

  // get session(): Session {
  //   return {
  //     get: async <T>(key: string, defaultValue?: any) => {
  //       return await Config.getInstance().session?.get<T>(
  //         this.sessionId!,
  //         key,
  //         defaultValue
  //       );
  //     },
  //     getAll: <T>() => {
  //       return Config.getInstance().session?.getAll<T>(this.sessionId!);
  //     },
  //     set: (key: string, val: any) =>
  //       Config.getInstance().session?.set(this.sessionId!, key, val),
  //   };
  // }
}
