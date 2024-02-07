import app from "./starmicro_ussd";
import express from "express";

const server = express();
const port = 3000

server.get('/ussd', (req, res) => {
  return app.express(req, res);
})

server.listen(port, () => {
  console.log(`StarMicro ussd app listening on port ${port}`)
})
