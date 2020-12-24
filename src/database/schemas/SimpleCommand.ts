import { getModelForClass, index, prop, queryMethod, ReturnModelType } from "@typegoose/typegoose";
const mongoose = require('mongoose');

export class SimpleCommand {
  @prop({ required: true, unique: true })
  public commandName?: string;
  @prop({ default: [] })
  public commandAliases?: string[];
  @prop({ required: true })
  public commandResponse?: string;
  @prop({ default: false })
  public replyInDM?: false;

}
export const SimpleCommandModel = getModelForClass(SimpleCommand)