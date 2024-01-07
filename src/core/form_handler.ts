import { FormInput, NextMenu, Type, ValidationResponse } from "@src/types";
import { Request, Response } from "@src/types/request";
import { State } from "@src/models/ussd-state";
import router, { DynamicMenu, Menu, Menus } from "@src/menus";
import { Config, ConfigOptions } from "@src/config";
import { BaseMenu, MenuAction } from "@src/menus";
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
  #errorMessage: string | undefined = undefined;

  get submittedInputs(): string[] {
    return Object.keys(this.state.form?.submitted ?? {}) || [];
  }

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

  private get session() {
    return Config.getInstance().session!;
  }

  private async endSession() {
    this.state.end();
    await this.session.removeState(this.state.sessionId);
  }

  // TODO: extract menu type to a separate type. is `any` for testing now
  async handle(): Promise<NextMenu | undefined> {
    // Initialize state form object
    this.request.state.form ??= {
      id: this.state.menu,
      // currentInput: undefined,
      nextInput: undefined,
      submitted: {},
    };

    if (menuType(this.menu) == "class") {
      this.#formInputs = await (this.menu as unknown as BaseMenu).inputs();
    } else {
      this.#formInputs = (this.menu as DynamicMenu).getInputs();
    }

    // First time the form menu is called, we pick the first input and display it
    if (
      this.submittedInputs.length == 0 &&
      this.state.form?.nextInput == null
    ) {
      this.#currentInput = this.#formInputs[0];
      // this.state.form!.currentInput = this.#currentInput.name;
      this.state.form!.nextInput = this.#currentInput.name;
      this.response.data = await this.buildResponse(this.#currentInput);
      return this.#errorMessage != null
        ? undefined
        : this.#currentInput?.next_menu;
    }

    // If the user has already entered an input, pick the next input
    // or else fallback to the current input
    if (this.state.form?.nextInput != null) {
      this.#currentInput = this.#formInputs.find(
        (item) => item.name == this.state.form?.nextInput
      );
    }

    await this.handleInput();

    // TODO: check if next input is defined, if not, we terminate the session or navigate to the next menu
    this.response.data = await this.buildResponse(this.#nextInput!);

    // if (this.#errorMessage != null) {
    //   this.state.form!.currentInput = undefined;
    // }
    return this.#errorMessage != null
      ? undefined
      : this.#currentInput?.next_menu;
  }

  private async handleInput() {
    // TODO: check if state has input id, if not pick the first input

    if (this.#currentInput == null) {
      throw new Error(
        `Input #${this.state.form?.id} is not defined in form/menu #${this.state.menu}`
      );
    }

    // Validate input
    if (this.#currentInput.validate != null) {
      let result = await validateInput({
        state: this.state,
        formInput: this.#currentInput,
        request: this.request,
        response: this.response,
      });

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

    // Track input as submitted
    this.state.form!.submitted[this.#currentInput.name] = true;

    // Terminate the session if necessary
    if (this.#currentInput.end != null) {
      let end =
        typeof this.#currentInput.end == "function"
          ? await this.#currentInput.end(this.request)
          : this.#currentInput.end;

      if (end && this.#currentInput.next_menu == null) {
        return await this.endSession();
      }
    }

    await this.resolveNextInput();
  }

  private async resolveNextInput() {
    // this.state.form ??= {
    //   id: this.state.menu,
    //   currentInput: this.#currentInput?.name,
    //   nextInput: undefined,
    // };

    if (
      this.#currentInput?.next_input != null &&
      this.#currentInput?.next_menu != null
    ) {
      throw new Error(
        `Input #${
          this.#currentInput
        } has both next_input and next_menu defined. Please define only one`
      );
    }

    // No next input & next menu, terminate the session
    if (
      this.#currentInput?.next_input == null &&
      this.#currentInput?.next_menu == null
    ) {
      return await this.endSession();
    }

    // No next input, but next menu is defined, navigate to the next menu (logic in handler())
    if (
      this.#currentInput?.next_input == null &&
      this.#currentInput?.next_menu != null
    ) {
      return;
    }

    if (typeof this.#currentInput.next_input == "string") {
      this.state.form!.nextInput = this.#currentInput.next_input;
    } else if (typeof this.#currentInput.next_input == "function") {
      this.state.form!.nextInput = await this.#currentInput.next_input(
        this.request
      );
    }

    // Lookup the next input
    this.#nextInput = await this.#formInputs.find(
      (item) => item.name == this.state.form?.nextInput
    );
    if (this.#nextInput == null) {
      await this.endSession();

      throw new Error(
        `Input #${this.state.form?.nextInput} is not defined in form/menu #${this.state.menu}`
      );
    }
  }

  private async buildResponse(input: FormInput) {
    let message = "";

    // If error message is not empty, we simply show that
    if (this.#errorMessage != null) {
      return this.#errorMessage;
    }

    // Otherwise, we show the display text
    // if (this.#nextInput == null) {
    //   // TODO: build response for next menu if exists!
    //   this.state.end();
    //   await this.session.removeState(this.state.sessionId);
    //   return message
    // }

    return await this.getDisplayText(input);
  }

  private async getDisplayText(input: FormInput) {
    if (typeof input?.display == "function") {
      return await input.display(this.request);
    }
    return input?.display;
  }
}
