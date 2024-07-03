import { configure, processCLIArgs, run } from "@japa/runner";
import { assert } from "@japa/assert";
import { anansePlugin } from "../src/japa-plugin";
import app from "../tests/test_app";

processCLIArgs(process.argv.splice(2));
configure({
  files: ["tests/**/*.spec.ts"],
  plugins: [
    assert(),
    anansePlugin({ phone: "23324143443", gateway: "wigal", app: app }),
  ],
});

run();
