import { getActiveTest, test } from "@japa/runner";
import router, { BaseMenu } from "../src/menus";
import { WigalGateway } from "../src/gateways/wigal.gateway";
import Ananse from "../src/core/app.core";
import { promisify } from "util";

test.group("Maths.add", () => {
  test("ussd test 1", async ({ ussd, assert }) => {
    await ussd.startServer();

    const resp = await ussd.steps(3, 3).send();
    console.log(await resp.text())

    assert.include(await resp.text(), "Yes");
    // console.log(ussd.setProvider("mtn").config);
  });

  test("add two numbers", ({ assert }) => {
    // Test logic goes here
    assert.equal(1 + 1, 2);
  });
});
