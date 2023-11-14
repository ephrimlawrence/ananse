class USSDState {
  network: string;
  sessionId: string;
  mode: "start" | "more" | "end";
  msisdn: string;
  userData: string;
  other?: string;

  constructor(menu) {
    this.menu = menu;
    this.name = null;
    this.run = null;
    this.defaultNext = null;
    this.val = null;
  }
}
