import { getModelForClass, index, prop, queryMethod, ReturnModelType } from "@typegoose/typegoose";
import { QueryMethod } from "@typegoose/typegoose/lib/types";
const mongoose = require('mongoose');

export class ChoobMessage {
  @prop({ required: true, unique: true })
  public message?: string;

}
export const ChoobMessageModel = getModelForClass(ChoobMessage)
