require("dotenv").config();

import axios from "axios";
// import { Wigal } from "./models/wigal";
import * as readline from "readline";
// import { UserType } from "../models/USSDTracking";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const APP_URL = "http://localhost:3000";
// const APP_URL = process.env.APP_URL;

class Simulator {
  argument = process.argv.slice(2)[0];
  url: string = `${APP_URL}?network=wigal_tigo_gh&sessionid=12345&mode=start&msisdn=233558331258&userdata&username=stevkky&trafficid=adc62161-05b2-4af5-98b1-a66c67f85c9d&other=first_menu`;

  async init() {
    let regex = new RegExp("[0-9]{10,}");
    if (regex.test(this.argument)) {
      this.url = `${APP_URL}?network=wigal_tigo_gh&sessionid=12345&mode=start&msisdn=${this.argument}&userdata&username=stevkky&trafficid=adc62161-05b2-4af5-98b1-a66c67f85c9d&other=first_menu`;
      return;
    }
  }

  async start() {
    try {
      let resp = await axios.get(this.url);
      let wigal = this.formatResponse(resp.data);
      console.log(resp.data);
      console.log(this.formatUserData(wigal.userdata));
      console.log("");

      if (wigal.isEndSession) process.exit(0);

      rl.question("Response: ", async (input) => {
        wigal.userdata = input;
        this.url = `${APP_URL}?${this.toUrlString(wigal)}`;
        return await this.start();
      });
    } catch (e) {
      console.log("SimError: ", e.message);
      process.exit();
    }
  }

  formatResponse(data: string) {
    let resp = data.split("|");
    let wigal: any = {};

    wigal.network = resp[0];
    wigal.mode = resp[1] as any;
    wigal.msisdn = resp[2];
    wigal.sessionid = resp[3];
    wigal.userdata = resp[4];
    wigal.username = resp[5];
    wigal.trafficid = resp[6];
    wigal.other = resp[7];

    return wigal;
  }

  formatUserData(data: string) {
    return data.replace(/\^/g, "\n");
  }

  toUrlString(data: any): string {
    return `network=${data.network}&sessionid=${data.sessionid}&mode=${data.mode}&msisdn=${data.msisdn}&userdata=${data.userdata}&username=${data.username}&trafficid=${data.trafficid}&other=${data.other}`;
  }
}

let simulator = new Simulator();
simulator.init().then(() => simulator.start());
