import { TestContext } from "@japa/runner/core";
import { getActiveTest } from "@japa/runner";
import App from "@src/core/app.core";
import { Gateway } from "@src/types";
import { randomUUID } from "crypto";
import { promisify } from "util";

const TEST_CONFIG = {} as Config;

class UssdTestRunner {
  #inputs: string[] = [];
  // #provider: Gateway;
  #phone: string | undefined = undefined;
  #debug: boolean = false;
  #sessionId: string | undefined = undefined;
  #rawResponse: Record<string, any> = {};
  #isRequestSent: boolean = false;
  // #app: App | undefined = undefined;
  #server: any = undefined;
  #config: Config = {} as Config;

  // #config = {} as Config;
  // #currentStep: string | undefined = undefined;

  constructor(_config: Config) {
    if (_config.app == null && _config.url == null) {
      throw new Error(
        "Please provide an app to start the server, or a url to make request to"
      );
    }

    this.#config = _config;
  }

  app(val: App) {
    this.#config.app = val;
    return this;
  }

  gateway(val: Gateway | keyof typeof Gateway) {
    if (typeof val == "string") {
      val = Gateway[val];
    }

    return this;
  }

  steps(...steps: string[] | number[]) {
    this.#inputs = this.#inputs.concat(steps.map((step) => step.toString()));
    return this;
  }

  input(value: string) {
    this.#inputs ??= [];
    this.#inputs.push(value);

    return this;
  }

  phone(val: string) {
    this.#phone = val;
  }

  debug(val: boolean) {
    this.#debug = val;
  }

  sessionId(val: string) {
    this.#sessionId = val;
  }

  async startServer() {
    if (this.#config.app == null && this.#url == null) {
      throw new Error(
        "Please provide an app to start the server, or a url to make request to"
      );
    }

    if (this.#server != null) {
      return this;
    }

    console.log("here");

    // const server = createServer(callback)
    // try {
    const test = getActiveTest();
    test?.cleanup(() => this.#server?.close());
    this.#server = this.#config.app?.listen(3000, "localhost", () => {
      this.#config.url = "http://localhost:3000";

      console.log(this.#config.url);
    });
    this.#config.url = "http://localhost:3000";
    return this.#server;
    // } catch (error) {}
    // server.listen(somePort)
  }

  stopServer() {
    // console.log(this.#server);
    if (this.#server != null) {
      this.#server.close(() => {
        console.log("Server stopped");
      });
      // this.#server.close();
      this.#server = undefined;
    }
  }

  async send(url?: string) {
    if (url != null) {
      this.#isRequestSent = true;
    }

    this.#inputs.unshift("");

    if ((this.#inputs || []).length == 0) {
      throw new Error(
        "No input provided. Please provide input using the input() or steps() method"
      );
    }

    // const temp = [...this.#inputs];
    for (const step of this.#inputs) {
      try {
        let resp = await fetch(this.reply(step));

        const data = await resp.text();

        await this.parseResponse(data);
      } catch (e) {
        if (this.#debug == true) {
          throw e;
        } else {
          console.log("Simulator error: ", e.message);
        }
        break;
      } finally {
        this.#isRequestSent = true;
      }
    }

    return {
      text: async () => {
        if (this.#isRequestSent == false) {
          await this.send();
        }

        let val = "Unable to parse text from response";
        if (this.#provider == Gateway.wigal) {
          val = this.#rawResponse.userdata;
        }

        return val.replace(/\^/g, "\n");
      },
      raw: () => {
        return this.#rawResponse;
      },
    };
  }

  // TODO
  // 1. bootstrap application, pass as config
  // 2. make request to url and parse response like in simulator
  // 3. add helper functions

  get #provider(): Gateway {
    return this.#config.provider;
  }

  get #url(): string {
    let val: string = this.#config.url || "";

    if (val.startsWith("localhost")) {
      val = "http://" + val;
    }

    return val;
  }

  private parseResponse(data: string) {
    this.log(data);

    if (this.#provider == Gateway.wigal) {
      let resp = data.split("|");
      this.#rawResponse = {
        network: resp[0],
        mode: resp[1] as any,
        msisdn: resp[2],
        sessionid: resp[3],
        userdata: resp[4],
        username: resp[5],
        trafficid: resp[6],
        other: resp[7],
        isEndSession: resp[1] == "end",
      };
    } else {
      throw new Error(
        `Response parsing is not implemented for ${this.#provider}`
      );
    }
  }

  private reply(input?: string) {
    let data = { ...this.#rawResponse };

    let url = "";
    if (this.#provider == Gateway.wigal) {
      data ??= {};
      const sessionId = data.sessionid || this.#sessionId || randomUUID();

      url = `${this.#url}?network=${
        data.network || "wigal_mtn_gh"
      }&sessionid=${sessionId}&mode=${data.mode || "start"}&msisdn=${
        data.msisdn || this.#phone
      }&userdata=${input}&username=${
        data.username || "test_user"
      }&trafficid=${randomUUID()}&other=${data.other || ""}`;
    } else {
      throw new Error(`Reply is not implemented for ${this.#provider}`);
    }

    this.log(url);

    return url;
  }

  private log(data: any) {
    if (this.#debug == true) {
      console.log("");
      console.log(data);
      console.log("");
    }
  }
}

export function scorpionPlugin(config: Config) {
  const obj = new UssdTestRunner(config);

  return function ({ emitter, runner, cliArgs, config }) {
    obj.debug(true);

    // emitter.on("test:setup", async function () {
    //   // await obj.startServer();
    //   // TODO: stop server
    //   console.log("setup initiated");
    // });
    // emitter.on("test:start", async function () {
    //   await obj.startServer();
    //   // TODO: stop server
    //   console.log("test started");
    // });

    // emitter.on("test:end", function () {
    //   // obj.stopServer();
    //   // TODO: stop server
    //   console.log("test ended");
    // });

    TestContext.getter("ussd", function () {
      return obj;
    });

    // console.log("hello world from myCustomPlugin");
  };
}

interface Config {
  app?: App;
  url?: string;
  provider: Gateway;
  phone?: string;
  session?: string; //TODO: same props used in core
}

// declare module "@japa/runner" {
//   interface TestContext {
//     sleep(milliseconds: number): Promise<void>;
//   }
// }
