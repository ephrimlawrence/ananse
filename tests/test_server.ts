import { server } from "../src/server.ts";
import router from "../src/models/router.ts";

// const route = Route

router
  .menu("main")
  .options([{ choice: "1", route: "1" }])
  .back("main");

console.log(router);
