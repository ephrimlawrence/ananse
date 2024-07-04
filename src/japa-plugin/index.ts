import { getActiveTest } from "@japa/runner";
import type { Ananse } from "../index";
import { randomUUID } from "node:crypto";
import { SupportedGateway } from "@src/helpers/constants";
// @ts-ignore
import { TestContext } from "@japa/runner/core";

export class TestRunner {
  #inputs: string[] = [];
  #phone: string | undefined = undefined;
  #debug: boolean = false;
  #sessionId: string | undefined = undefined;
  #rawResponse: Record<string, any> = {};
  #server: any = undefined;
  #config: Config = {} as Config;

  constructor(_config: Config) {
    this.#config = _config;
  }

  app(val: Ananse) {
    this.#config.app = val;
    return this;
  }

  gateway(val: SupportedGateway) {
    this.#config.gateway = val;

    return this;
  }

  steps(...steps: string[] | number[]) {
    this.#inputs = this.#inputs.concat(steps.map((step) => step.toString()));
    return this;
  }

  input(value: string | number) {
    this.#inputs ??= [];
    this.#inputs.push(value.toString());

    return this;
  }

  phone(val: string) {
    this.#phone = val;
    return this;
  }

  debug(val: boolean) {
    this.#debug = val;
    return this
  }

  sessionId(val: string) {
    this.#sessionId = val;
  }

  async startServer() {
    if (this.#config.app == null && this.#url == null) {
      throw new Error(
        "Please provide an app to start the server, or a url to make request to",
      );
    }

    // If url is provided, run tests against the url instead of starting a server
    if (this.#config.app == null && this.#url != null) {
      return
    }

    if (this.#server != null) {
      return this;
    }

    const url = new URL(this.#url)
    // const test = getActiveTest();
    // test?.cleanup(() => this.stopServer());

    this.#server = this.#config.app?.listen(+url.port, url.hostname, () => {
      if (this.#debug) {
        console.log(`Server started at: ${this.#url}`);
      }
    });
    return this.#server;
    // } catch (error) {}
    // server.listen(somePort)
  }

  async stopServer() {
    // console.log(this.#server);
    console.log("ending server");
    if (this.#server != null) {
      await this.#server.close(() => {
        console.log("Server stopped");
      });
      // this.#server.close();
      this.#server = undefined;

      return;
    }

    return;
  }

  async send(url?: string) {
    if (this.#config.app == null && this.#config.url == null) {
      throw new Error(
        "Please provide an app to start the server, or a url to make request to",
      );
    }

    if (this.#inputs.length === 0) {
      throw new Error(
        "No input provided. Please provide input using the input() or steps() method",
      );
    }

    // const temp = [...this.#inputs];
    for (const step of this.#inputs) {
      try {
        const resp = await fetch(this.reply(step, url), { headers: this.#config.headers ?? {} });

        const data = await resp.text();

        await this.parseResponse(data);
      } catch (e) {
        if (this.#debug) {
          throw e;
        }
        console.log(e.message);
        break;
      } finally {
        this.#isRequestSent = true;
      }
    }

    return {
      text: () => {
        console.log(this.#rawResponse);
        // if (this.#isRequestSent === false) {
        //   await this.send();
        // }

        // let val = "Unable to parse text from response";
        if (this.#provider === SupportedGateway.wigal) {
          return this.#rawResponse.userdata.replace(/\^/g, "\n")
        }
        throw new Error(`Text parsing is not implemented for ${this.#provider}`);

        // if (this.#debug) {
        //   console.log(val);
        // }

        // return this.#rawResponse.userdata;
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

  get #provider(): SupportedGateway {
    return this.#config.gateway as SupportedGateway;
  }

  get #url(): string {
    let val: string = this.#config.url || "http://localhost:3000";

    if (val.startsWith("localhost")) {
      val = `http://${val}`;
    }

    return val;
  }

  private parseResponse(data: string) {
    this.log(data);

    if (this.#provider === SupportedGateway.wigal) {
      const resp = data.split("|");
      this.#rawResponse = {
        network: resp[0],
        mode: resp[1] as any,
        msisdn: resp[2],
        sessionid: resp[3],
        userdata: resp[4],
        username: resp[5],
        trafficid: resp[6],
        other: resp[7],
        isEndSession: resp[1] === "end",
      };
    } else {
      throw new Error(
        `Response parsing is not implemented for ${this.#provider}`,
      );
    }
  }

  private reply(input?: string, severUrl?: string) {
    let data = { ...this.#rawResponse };

    let url = "";
    if (this.#provider === SupportedGateway.wigal) {
      data ??= {};
      const sessionId = data.sessionid || this.#sessionId || randomUUID();

      url = `${severUrl || this.#url}?network=${data.network || "wigal_mtn_gh"
        }&sessionid=${sessionId}&mode=${data.mode || "start"}&msisdn=${data.msisdn || this.#phone
        }&userdata=${input}&username=${data.username || "test_user"
        }&trafficid=${randomUUID()}&other=${data.other || ""}`;
    } else {
      throw new Error(`Reply is not implemented for ${this.#provider}`);
    }

    this.log(url);

    return url;
  }

  private log(data: any) {
    if (this.#debug === true) {
      console.log("");
      console.log(data);
      console.log("");
    }
  }
}

/**
 * Japa plugin for testing ussd applications
 *
 */
export function anansePlugin(config: Config) {
  const obj = new TestRunner(config);

  // @ts-ignore
  // biome-ignore lint/complexity/useArrowFunction: <explanation>
  return function ({ emitter, runner, cliArgs, config }) {
    // return function (emitter, config, runner, { Test, TestContext, Group }) {
    console.log(emitter)
    console.log(config)
    console.log(runner)
    console.log(cliArgs)

    obj.debug(false);

    emitter.on("test:cleanup", async function () {
      // await obj.startServer();
      // TODO: stop server
      console.log("setup initiated");
    });
    emitter.on("group:cleanup", async function () {
      // await obj.startServer();
      // TODO: stop server
      console.log("setup sdd");
    });
    // emitter.on("test:start", async function () {
    //   await obj.startServer();
    //   // TODO: stop server
    //   console.log("test started");
    // });

    emitter.on("group:end", function () {
      obj.stopServer();
      // TODO: stop server
      console.log("test ended");
    });

    // biome-ignore lint/complexity/useArrowFunction: <explanation>
    TestContext.getter("ussd", function () {
      return obj;
    });
  };
}

interface Config {
  /**
   * Instance of the Ananse application to use. This is required if the `url` is not provided.
   */
  app?: Ananse;

  /**
   * USSD server URL to make request to. Required if the `app` is not provided
   * Defaults to http://localhost:3000
   */
  url?: string;

  /**
   * Additional headers to send with the HTTP request
   */
  headers?: Record<string, string>;

  gateway: SupportedGateway;
  phone?: string;
  session?: string; //TODO: same props used in core
}
// @ts-ignore

declare module '@japa/runner/core' {
  interface TestContext {
    ussd: TestRunner
  }
}

// declare module "@japa/runner" {
//   interface TestContext {
//     sleep(milliseconds: number): Promise<void>;
//   }
// }
