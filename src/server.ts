import "reflect-metadata";
import * as config from "config";
import { InversifyExpressServer } from "inversify-express-utils";
import container from "./inverisy.config";
import * as express from "express";
import mongoose from "mongoose";
import "./controller";

// const app:Express = express()
// app.use(express.json())
const server = new InversifyExpressServer(container);
server.setConfig((app) => {
  app.use(express.json());
  // app.use()
});
server.build().listen(config.get("Localhost.port"), () => {
  console.log("server running on port " + config.get("Localhost.port"));
});

mongoose
  .connect(config.get("Localhost.dbConfig"))
  .then(() => {
    console.log("db connected");
  })
  .catch((err) => {
    console.log("db not connected");
  });
//changesssssss