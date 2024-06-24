import "reflect-metadata";
import * as config from "config";
import { InversifyExpressServer } from "inversify-express-utils";
import container from "./src/inverisy.config";
import * as express from "express";
import mongoose from "mongoose";
import "./src/controller";
import  * as cors from 'cors'
// const app:Express = express()
// app.use(express.json())
const server = new InversifyExpressServer(container);
server.setConfig((app) => {
  app.use(express.json());
  app.use(cors())
});
server.build().listen(config.get("port"), () => {
  console.log("server running on port " + config.get("port"));
});

mongoose
  .connect(config.get("dbConfig"))
  .then(() => {
    console.log("db connected");
  })
  .catch((err) => {
    console.log("db not connected");
  });
//changessssss