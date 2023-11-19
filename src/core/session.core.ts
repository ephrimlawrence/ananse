import { State } from "@src/models/ussd-state";

export class Session {
  private static instance: Session;

  private states: { [key: string]: State } = {};

  private constructor() {}

  public static getInstance(): Session {
    if (!Session.instance) {
      Session.instance = new Session();
    }

    return Session.instance;
  }

  setState(id: string, state: State) {
    this.states[id] = state;
  }

  getState(id: string): State | undefined {
    return this.states[id];
  }

  removeState(id: string): void {
    delete this.states[id];
  }
}
