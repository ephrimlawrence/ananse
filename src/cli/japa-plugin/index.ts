import { TestContext } from "@japa/runner/core";
import { randomUUID } from "crypto";

const TEST_CONFIG: Partial<Config> = {};

class UssdTestRunner {
  get url() {
    return TEST_CONFIG.url;
  }

  get config() {
    return TEST_CONFIG;
  }

  setProvider(provider: string) {
    TEST_CONFIG.provider = provider;

    return this;
  }

  me() {
    return this;
  }

  // TODO
  // 1. bootstrap application, pass as config
  // 2. make request to url and parse response like in simulator
  // 3. add helper functions
}

export function scorpionPlugin(config: Config) {
  TEST_CONFIG.url = config.url || "http://localhost:3000";
  TEST_CONFIG.provider = config.provider;
  TEST_CONFIG.phone = config.phone; //TODO: generate one from faker
  TEST_CONFIG.session = config.session || randomUUID();

  return function ({ emitter, runner, cliArgs, config }) {
    TestContext.getter("ussd", function () {
      return new UssdTestRunner();
      // const { url, provider, phone, session } = TEST_CONFIG;

      // return {
      //   setProvider: (provider: string) => {
      //     TEST_CONFIG.provider = provider;

      //     console.log("here", TEST_CONFIG);
      //     return this;
      //   },
      //   config: () => {
      //     return TEST_CONFIG;
      //   },
      // };
      // return new Promise((resolve) => {
      //   setTimeout(resolve, milliseconds);
      // });
    });

    console.log("hello world from myCustomPlugin");
  };
}

interface Config {
  url?: string;
  provider: string;
  phone: string;
  session?: string; //TODO: same props used in core
}

// declare module '@japa/runner/core' {
//   interface TestContext {
//     sleep(milliseconds: number): Promise<void>
//   }
// }
