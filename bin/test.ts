import { configure, processCLIArgs, run } from "@japa/runner";
import { assert } from "@japa/assert";
import { scorpionPlugin } from "../src/cli/japa-plugin";

processCLIArgs(process.argv.splice(2));
configure({
  files: ["tests/**/*.spec.ts"],
  plugins: [
    assert(),
    scorpionPlugin({ phone: "23324143443", provider: "wigal" }),
  ],
});

run();