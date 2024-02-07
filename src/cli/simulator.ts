import { randomUUID } from "crypto";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

class Simulator {
  args: {
    phone?: string;
    host?: string;
    provider?: "hubtel" | "wigal";
    debug?: boolean | string;
  } = {};

  get provider(): "hubtel" | "wigal" {
    return this.args.provider || "wigal";
  }

  get baseUrl(): string {
    return `${this.args.host || "http://localhost:3000"}`;
  }

  // get generateRequestUrl(): string {
  //   if (this.provider == "wigal") {
  //     return `${this.baseUrl}?network=wigal_tigo_gh&sessionid=12345&mode=start&msisdn=${this.args.phone}&userdata&username=stevkky&trafficid=adc62161-05b2-4af5-98b1-a66c67f85c9d&other=first_menu`;
  //   }

  //   throw new Error(`${this.provider} is not implemented`);
  // }

  async init() {
    this.parseArguments();
  }

  private parseArguments() {
    this.args["phone"] = process.argv.slice(2)[0];
    if (this.args.phone == null || this.args.phone?.trim() == "") {
      console.log("Please provide a phone number!");
      process.exit(1);
    }
    if (!/[0-9]{10,}/.test(this.args.phone)) {
      console.log("Invalid phone number!");
      process.exit(1);
    }

    process.argv.slice(2).forEach((arg) => {
      const [key, value] = arg.split("=");

      // @ts-ignore
      this.args[key.replace(/(-)+/, "")] = value;
    });
  }

  async start(url?: string) {
    try {
      let resp = await fetch(url || this.reply());

      const data = await resp.text();

      let wigal = this.parseResponse(data);

      console.log("");
      console.log(this.displayText(wigal));
      console.log("");

      if (wigal.isEndSession) process.exit(0);

      rl.question("Response: ", async (input) => {
        return await this.start(this.reply(wigal, input));
      });
    } catch (e) {
      console.log("Simulator error: ", e);
      this.log(e);
      process.exit(1);
    }
  }

  reply(data?: any, input?: string) {
    let url = "";
    if (this.provider == "wigal") {
      data ??= {};
      data.userdata = input != null ? input : data.userdata;

      url = `${this.baseUrl}?network=${
        data.network || "wigal_mtn_gh"
      }&sessionid=${data.sessionid || randomUUID()}&mode=${
        data.mode || "start"
      }&msisdn=${data.msisdn || this.args.phone}&userdata=${input}&username=${
        data.username || "test_user"
      }&trafficid=${randomUUID()}&other=${data.other || ""}`;
    } else {
      throw new Error(`Reply is not implemented for ${this.provider}`);
    }

    this.log(url);

    return url;
  }

  parseResponse(data: string) {
    this.log(data);

    if (this.provider == "wigal") {
      let resp = data.split("|");
      return {
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
    }
    throw new Error(`Response parsing is not implemented for ${this.provider}`);
  }

  displayText(data: any) {
    let text = "Unable to parse text from response";
    if (this.provider == "wigal") {
      text = data.userdata;
    }

    return text.replace(/\^/g, "\n");
  }

  log(data: any) {
    this.args.debug = true;
    if (this.args.debug == true || this.args.debug == "true") {
      console.log("");
      console.log(data);
      console.log("");
    }
  }
}

let simulator = new Simulator();
simulator.init().then(() => simulator.start());
