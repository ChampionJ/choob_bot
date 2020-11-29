import { mongoose } from "@typegoose/typegoose";
import { EventEmitter } from "events";
import { connect, connection } from "mongoose";
import winston from "winston";

const logger = winston.loggers.get('main');

class StateManager extends EventEmitter {
  connection: import("mongoose").Connection;
  constructor(options: any) {
    super(options);
    this.connection = connection
    connect(process.env.DATABASE!, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
  }
}

export = new StateManager(undefined);