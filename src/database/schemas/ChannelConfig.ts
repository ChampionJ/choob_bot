import { getModelForClass, prop } from "@typegoose/typegoose";
const mongoose = require('mongoose');

class ChannelConfig {
  @prop({ required: true, unique: true })
  public channelName?: string;
  @prop({ required: true, default: '!' })
  public prefix?: string;
  @prop({ required: true, default: false })
  public adminChannel?: boolean;
}

module.exports = getModelForClass(ChannelConfig)