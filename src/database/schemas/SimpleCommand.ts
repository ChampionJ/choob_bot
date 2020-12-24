import { getModelForClass, index, mongoose, prop, queryMethod, ReturnModelType } from "@typegoose/typegoose";
export class SimpleCommand {
  _id?: mongoose.Types.ObjectId;
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