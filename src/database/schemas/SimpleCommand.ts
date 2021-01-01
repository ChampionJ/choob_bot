import { getModelForClass, index, mongoose, prop, queryMethod, ReturnModelType } from "@typegoose/typegoose";
import BaseCommand from "../../utils/structures/BaseCommand";

export class CustomCommandInfo {
  @prop({ required: true })
  name!: string
  @prop({})
  channel!: string
}
export class CustomCommand {
  _id?: mongoose.Types.ObjectId;
  @prop({ required: true, unique: true })
  public info!: CustomCommandInfo;
  @prop({ default: [], type: [String] })
  public aliases?: string[];
  @prop({ required: true })
  public response!: string;
  @prop({ default: false })
  public replyInDM?: false;
}
export const CustomCommandModel = getModelForClass(CustomCommand)
