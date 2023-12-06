import { getActiveTest, test } from "@japa/runner";
import router, { BaseMenu } from "../src/menus";
import { DefaultMiddleware } from "../src/middlewares/default.middleware";
import App from "../src/core/app.core";
import { promisify } from "util";

test.group("Maths.add", () => {
  test("ussd test 1", async ({ ussd, assert }) => {
    const resp = await ussd.send();
    console.log(await resp.text())

    assert.include(await resp.text(), "Check Balance");
    // console.log(ussd.setProvider("mtn").config);
  });

  test("add two numbers", ({ assert }) => {
    // Test logic goes here
    assert.equal(1 + 1, 2);
  });
});
