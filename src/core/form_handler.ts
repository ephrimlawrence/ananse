import { FormInput, Type, ValidationResponse } from "@src/types";
import { Request, Response } from "@src/types/request";
import { State } from "@src/models/ussd-state";
import { ServerResponse, IncomingMessage } from "http";
import { createServer } from "http";
import { parse } from "url";
import router, { DynamicMenu, Menu, Menus } from "@src/menus";
import { Config, ConfigOptions } from "@src/config";
import { BaseMenu, MenuAction } from "@src/menus";
import { MENU_CACHE } from "./state.core";
import { menuType, validateInput } from "@src/helpers/index.helper";

// TODO: change to project name
export class FormMenuHandler {
  constructor(
    private readonly request: Request,
    private readonly response: Response,
    private readonly menu: Menu
  ) {}

  #currentInput: FormInput | undefined = undefined;
  #nextInput: FormInput | undefined = undefined;
  #formInputs: FormInput[] = [];

  // #displayText: string | undefined = undefined;
  #errorMessage: string | undefined = undefined;

  get state(): State {
    return this.request.state;
  }

  /**
   * Generate a key for the form input in the format `[menu_name]_[input_name]`
   * The key is used to store/retrieve the input in/from the session
   *
   * @example registration_first_name
   */
  getInputKey(input: string) {
    return `${this.state.menu}_${input}`;
  }

  private async handleInput() {
    // let inputs: FormInput[] = [];
    // let currentInput: FormInput | undefined = undefined;

    // Initialize state form object
    this.request.state.form ??= {
      id: this.state.menu,
      currentInput: undefined,
      nextInput: undefined,
    };

    if (menuType(this.menu) == "class") {
      this.#formInputs = await (this.menu as unknown as BaseMenu).inputs();
    } else {
      this.#formInputs = (this.menu as DynamicMenu).getInputs();
    }

    // TODO: check if state has input id, if not pick the first input
    if (this.state.form?.currentInput != null) {
      this.#currentInput = this.#formInputs.find(
        (item) => item.name == this.state.form?.currentInput
      );
    } else {
      // Pick the first input
      this.#currentInput = this.#formInputs[0];
    }

    if (this.#currentInput == null) {
      throw new Error(
        `Input #${this.state.form?.id} is not defined in form/menu #${this.state.menu}`
      );
    }

    // Validate input
    if (this.#currentInput.validate != null) {
      let result = await validateInput(
        this.state,
        this.menu,
        this.request,
        this.response
      );

      // If input is invalid, stop processing and return the error message
      if (!result.valid) {
        this.#errorMessage =
          result.error || (await this.getDisplayText(this.#currentInput));
        return;
      }
    }

    // Validation passed, call handler to allow the user to process the input
    if (this.#currentInput.handler != null) {
      await this.#currentInput.handler(this.request, {
        get: async <T>(key: string, defaultValue?: any) => {
          return await Config.getInstance().session?.get<T>(
            this.request.state.sessionId!,
            key,
            defaultValue
          );
        },
        getAll: <T>() => {
          return Config.getInstance().session?.getAll<T>(
            this.request.state.sessionId
          );
        },
        set: (key: string, val: any) =>
          Config.getInstance().session?.set(
            this.request.state.sessionId,
            key,
            val
          ),
      });
    }

    // Save the input to the session
    await this.session.set(
      this.state.sessionId,
      this.getInputKey(this.#currentInput.name),
      this.state.userData
    );

    // Terminate the session if necessary
    if (this.#currentInput.end != null) {
      if (typeof this.#currentInput.end == "function") {
        if (this.#currentInput.end(this.request)) {
          this.state.end();
          await this.session.removeState(this.state.sessionId);
          return;
        }
      } else if (this.#currentInput.end == true) {
        this.state.end();
        await this.session.removeState(this.state.sessionId);
        return;
      }
    }

    await this.resolveNextInput();
  }

  private async resolveNextInput() {
    this.state.form ??= {
      id: this.state.menu,
      currentInput: this.#currentInput?.name,
      nextInput: undefined,
    };

    // No next input, we terminate the session
    if (this.#currentInput?.next_input == null) {
      this.state.end();
      await this.session.removeState(this.state.sessionId);
      return;
    }

    if (typeof this.#currentInput.next_input == "string") {
      this.state.form.nextInput = this.#currentInput.next_input;
    }

    if (typeof this.#currentInput.next_input == "function") {
      this.state.form.nextInput = await this.#currentInput.next_input(
        this.request
      );
    }

    // Lookup the next input
    this.#nextInput = await this.#formInputs.find(
      (item) => item.name == this.state.form?.nextInput
    );
    if (this.#nextInput == null) {
      this.state.end();
      await this.session.removeState(this.state.sessionId);

      // TODO: check if next menu is defined, if not, we terminate the session
      // FIXME: we're terminating the session for now
      throw new Error(
        `Input #${this.state.form?.nextInput} is not defined in form/menu #${this.state.menu}`
      );
    }
  }

  private async getDisplayText(input: FormInput) {
    if (typeof input.display == "function") {
      return await input.display(this.request);
    }
    return input.display;
  }

  /**
   * Track the state of the USSD session
   */
  // private readonly states: { [msisdn: string]: State } = {};

  // configure(opts: ConfigOptions) {
  //   const instance = Config.getInstance();
  //   instance.init(opts);

  //   return this;
  // }

  // private get currentMenu(): Menu {
  //   return this._currentMenu;
  // }

  // private async setCurrentMenu(id: string, val: Menu, state?: State) {
  //   this._currentMenu = val;

  //   if (state != null) {
  //     state.menu = id;
  //     await this.session.setState(state.sessionId, state);
  //   }
  // }

  private get config(): Config {
    return Config.getInstance();
  }

  private get session() {
    return this.config.session!;
  }

  // private get currentMenu(): Menu {
  //   return this.currentState.menu;
  // }

  // private menuType(val?: Menu): "class" | "dynamic" {
  //   if (/^DynamicMenu$/i.test((val || this.currentMenu).constructor.name)) {
  //     return "dynamic";
  //   }
  //   return "class";
  // }

  // listen(port?: number, hostname?: string, listeningListener?: () => void) {
  //   // TODO: Resolve all menu naming conflicts and other sanity checks before starting the server
  //   return createServer((req, res) => this.requestListener(req, res)).listen(
  //     port,
  //     hostname,
  //     listeningListener
  //   );
  // }

  // get currentState() {
  //   return Config.getInstance().session?.getState(
  //     this.request.state?.sessionId
  //   )!;
  // }

  async handle() {
    await this.handleInput();

    this.response.data = await this.buildResponse();

    return this.response.data;
    // // this.router = router;
    // // TODO: implement framework logic
    // // 1. Process request via middleware
    // // 2. Lookup route
    // //  2a. Process request in route
    // // 3. Process response via middleware

    // // FIXME: optmize state access for persistent session.
    // // ! Pass state as args to the functions and update the state after the last function returns

    // // Resolve middlewares
    // const state = (await this.resolveMiddlewares("request"))!;

    // // Lookup menu
    // await this.lookupMenu(state);

    // // Resolve menu options
    // await this.lookupMenuOptions(state);

    // await this.resolveMenuOption(state);

    // // Validate user data
    // const status = await this.validateUserData(state);

    // // const _tempState = (await this.currentState)!;
    // // If there's validation error, the user cannot be moved to the next menu (error source),
    // // the user must still be on the current menu until the input passes validation
    // if (status != true) {
    //   this.response.data = await this.buildResponse(
    //     MENU_CACHE[state.previousMenu!]
    //   );
    // } else {
    //   this.response.data = await this.buildResponse(this.menu);
    // }
    // // TODO: cache current state

    // // Reset temp fields
    // state.action = undefined;
    // this.errorMessage = undefined;
    // await this.session.setState(state.sessionId, state);

    // // Resolve middlewares
    // await this.resolveMiddlewares("response");
  }

  // private async validateUserData(state: State): Promise<ValidationResponse> {
  //   let status: ValidationResponse = true;
  //   if (this.menuType() == "class") {
  //     status = await (this.menu as unknown as BaseMenu).validate(
  //       state?.userData
  //     );
  //   } else {
  //     status = await (this.menu as DynamicMenu).validateInput(
  //       this.request,
  //       this.response
  //     );
  //   }

  //   if (typeof status == "string" || status == false) {
  //     // TODO: if no text is provided, return the current text
  //     this.errorMessage = status || "Invalid input";
  //   }
  //   return status;
  // }

  private async buildResponse(input: FormInput) {
    let message = "";

    // If error message is not empty, we simply show that
    if (this.#errorMessage != null) {
      return this.#errorMessage;
    }

    // Otherwise, we show the display text
    if (this.#nextInput == null) {
      // TODO: build response for next menu if exists!
      this.state.end();
      await this.session.removeState(this.state.sessionId);
      return;
    }

    return await this.getDisplayText(this.#nextInput);
  }

  // private async resolveMenuOption(state: State) {
  //   // const _state = (await this.currentState)!;
  //   const action = state.action;

  //   // Execute the action handler
  //   if (action?.handler != null) {
  //     await action.handler(this.request, this.session);
  //   }

  //   // Resolve next menu and make it the current menu
  //   let _menu: Menu;

  //   if (typeof action?.next_menu == "string") {
  //     await this.setCurrentMenu(
  //       action.next_menu!,
  //       this.instantiateMenu(this.router.getMenu(action.next_menu!)),
  //       state
  //     );
  //     return this.menu;
  //   } else if (typeof action?.next_menu == "function") {
  //     const id = await action.next_menu(this.request, this.response);

  //     await this.setCurrentMenu(
  //       id,
  //       this.instantiateMenu(this.router.getMenu(id)),
  //       state
  //     );

  //     return this.menu;
  //   }

  //   // Fallback to default next menu
  //   _menu = this.instantiateMenu(this.menu);
  //   if (this.menuType(_menu) == "class") {
  //     const _next = await (_menu as unknown as BaseMenu).nextMenu();
  //     if (_next == null) {
  //       state.mode = "end";
  //       await this.session.setState(state.sessionId, state);
  //       return;
  //     }

  //     await this.setCurrentMenu(
  //       _next,
  //       this.instantiateMenu(this.router.getMenu(_next)),
  //       state
  //     );

  //     return;
  //   }

  //   const _next = await (_menu as DynamicMenu).getDefaultNextMenu(
  //     this.request,
  //     this.response
  //   );

  //   if (_next != null) {
  //     await this.setCurrentMenu(
  //       _next,
  //       this.instantiateMenu(this.router.getMenu(_next)),
  //       state
  //     );
  //   }

  //   state.mode = state.isStart ? "more" : "end";
  //   await this.session.setState(state.sessionId, state);

  //   return;
  // }

  // private instantiateMenu(menu: Menu) {
  //   if (this.menuType(menu) == "class") {
  //     if (menu instanceof BaseMenu) {
  //       return menu;
  //     }

  //     // @ts-ignore
  //     this.menu = new menu(this.request, this.response);
  //     return this.menu;
  //   }

  //   return menu;
  // }

  // private async lookupMenuOptions(state: State) {
  //   let actions: MenuAction[] = [];

  //   if (this.menuType() == "class") {
  //     actions = await (this.menu as unknown as BaseMenu).actions();
  //   } else {
  //     actions = (this.menu as DynamicMenu).getActions();
  //   }

  //   // if (actions.length == 0) {
  //   //   throw new Error(
  //   //     `Menu #${this.currentMenu.toString()} has no actions. At least one option must be defined`
  //   //   );
  //   // }

  //   // if (this.currentState.isStart) {
  //   //   this.currentState.action = actions[0];
  //   //   return this.currentState.action;
  //   // }

  //   // Loop through the actions, and find the one that matches the user input
  //   // const _state = (await this.currentState)!;
  //   const input = state.userData;
  //   for (const action of actions) {
  //     if (typeof action.choice == "function") {
  //       const result = await action.choice(input, this.request, this.response);
  //       if (result == input) {
  //         state.action = action;
  //         break;
  //       }
  //     }

  //     if (
  //       typeof action.choice == "string" ||
  //       typeof action.choice == "number"
  //     ) {
  //       if (action.choice == input || action.choice == "*") {
  //         state.action = action;
  //         break;
  //       }
  //     }

  //     try {
  //       console.log(action.choice, input, typeof action.choice);
  //       if ((action.choice as RegExp).test(input)) {
  //         state.action = action;
  //         break;
  //       }
  //     } catch (e) {}
  //   }

  //   this.session.setState(state.sessionId, state);
  // }

  // private async lookupMenu(state: State) {
  //   let menu: Menu | undefined = undefined,
  //     id: string | undefined = undefined;

  //   // If the request is a start request, we need to lookup the start menu
  //   if (state.isStart) {
  //     const _value = this.router.getStartMenu(this.request, this.response);
  //     id = _value.id;
  //     menu = _value.obj;
  //   } else {
  //     if (state.menu == null) {
  //       throw new Error(`Menu for #${state.sessionId} is not defined`);
  //     }

  //     menu = this.menu;
  //     // menu = this.currentState.menu;
  //   }

  //   this.setCurrentMenu(id!, this.instantiateMenu(menu), state);
  // }

  // private async resolveMiddlewares(stage: "request" | "response") {
  //   if (stage == "request") {
  //     for (const middleware of this.config.middlewares) {
  //       const item = new middleware(this.request, this.response);
  //       const _state = (await item.handleRequest(this.request, this.response))!;
  //       await this.session.setState(_state.sessionId, _state)!;

  //       return _state;
  //       // await this.session.setState(item.sessionId, this.request.state);
  //       // this.currentState = (await this.session.getState(item.sessionId))!;
  //     }
  //   }

  //   if (stage == "response") {
  //     for (const middleware of this.config.middlewares) {
  //       const item = new middleware(this.request, this.response);
  //       await item.handleResponse(this.request, this.response);
  //       // this.states[this.request.state.msisdn] = this.request.state;
  //     }
  //   }

  //   return;
  // }

  // private async requestListener(req: IncomingMessage, res: ServerResponse) {
  //   const request = new Request(parse(req.url!, true), req);

  //   if (req.method == "POST" || req.method == "PUT" || req.method == "PATCH") {
  //     let data = "";

  //     req.on("data", (chunk) => {
  //       data += chunk;
  //     });

  //     req.on("end", () => {
  //       try {
  //         if (req.headers["content-type"] == "application/json") {
  //           request.body = JSON.parse(data);
  //         }
  //         // TODO: parse other content types
  //       } catch (error) {
  //         res.writeHead(400, { "Content-Type": "application/json" });
  //         res.end(
  //           JSON.stringify({ error: "Invalid JSON format in the request body" })
  //         );
  //       }
  //     });

  //     // res.end("Hello, World!");
  //     // TODO: Handle request/response
  //   }

  //   this.request = request;
  //   this.response = res as Response;
  //   await this.handle();
  // }
}

// export default App;
