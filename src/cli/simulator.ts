#!/usr/bin/env node

import { SupportedGateway } from "@src/helpers/constants";
import { randomUUID } from "crypto";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const CACHE: Record<SupportedGateway, { sessionId?: string, operator?: string }> = { wigal: {}, emergent_technology: {} };


class Simulator {
  args: {
    phone?: string;
    url?: string;
    provider?: SupportedGateway;
    debug?: boolean | string;
  } = {};

  // TODO: Implement emergent ussd
  get provider() {
    return this.args.provider
  }

  get baseUrl(): string {
    return `${this.args.url || "http://localhost:3000"}`;
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
    this.args["provider"] = process.argv.slice(2)[1] as SupportedGateway;
    this.args["url"] = process.argv.slice(2)[2];

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

  async start(url?: string, requestBody?: any) {
    try {


      if (this.provider == SupportedGateway.wigal) {
        const resp = await fetch(url || (this.reply() as string));
        const data = await resp.text();

        let wigal = this.parseResponse(data);

        console.log("");
        console.log(this.displayText(wigal.userdata));
        console.log("");

        if (wigal.isEndSession) process.exit(0);

        rl.question("Response: ", async (input) => {
          return await this.start(this.reply(wigal, input) as string);
        });
      } else if (this.provider == SupportedGateway.emergent_technology) {
        const { url, body } = this.reply(requestBody) as { url: string, body: any };
        console.log(url, body);

        const resp = await fetch(url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });

        // console.log(resp.text());
        const json: { Message: string, type: 'Release' | 'Response' } = await resp.json();

        // let emergence = this.parseResponse(data);
        if (json.type == 'Release') process.exit(0);

        console.log("");
        console.log(this.displayText(json.Message));
        console.log("");

        rl.question("Response: ", async (input) => {
          const { url, body } = this.reply(json, input) as { url: string, body: any };

          return await this.start(url, body);
        });
      }
    } catch (e) {
      console.log("Simulator error: ", e);
      this.log(e);
      process.exit(1);
    }
  }

  reply(data?: any, input?: string): string | { url: string, body: any } {
    if (this.provider == SupportedGateway.wigal) {
      // Wigal reply
      data ??= {};
      data.userdata = input != null ? input : data.userdata;

      const url = `${this.baseUrl}?network=${data.network || "wigal_mtn_gh"
        }&sessionid=${data.sessionid || randomUUID()}&mode=${data.mode || "start"
        }&msisdn=${data.msisdn || this.args.phone}&userdata=${input}&username=${data.username || "test_user"
        }&trafficid=${randomUUID()}&other=${data.other || ""}`;

      this.log(url);
      return url;
    }

    if (this.provider == SupportedGateway.emergent_technology) {
      // Emergent Technology
      data ??= {
        "Mobile": this.args.phone,
        "Message": "*714#"
      };
      data.Message = input != null ? input : data.Message;
      // SessionId is not included in the response, so we read from cache first
      data.SessionId = CACHE[this.provider].sessionId || randomUUID()
      data.Type ??= 'Initiation'
      data.Mobile = this.args.phone;
      data.Operator = "Vodafone"
      data.ServiceCode = "714"

      // TODO: Auto detect operator/network from phone number

      CACHE[this.provider].sessionId = data.SessionId

      return { url: this.baseUrl, body: data };
    }

    throw new Error(`Reply is not implemented for ${this.provider}`);
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

  displayText(text: string | undefined) {
    text ??= "Unable to parse text from response";

    return text?.replace(/\^/g, "\n");
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
