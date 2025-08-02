import { configure, processCLIArgs, run } from "@japa/runner";
import { assert } from "@japa/assert";
import { ananseJapaPlugin } from "../src/cli/japa-plugin";
import app from "../tests/test_app";
import { SupportedGateway } from "@src/index";

processCLIArgs(process.argv.splice(2));
configure({
  files: ["tests/**/*.spec.ts"],
  plugins: [
    assert(),
    ananseJapaPlugin({ phone: "23324143443", gateway: SupportedGateway.wigal, app: app }),
  ],
});

run();
