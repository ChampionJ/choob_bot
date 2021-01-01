import { getModelForClass, index, mongoose, prop, queryMethod, ReturnModelType } from "@typegoose/typegoose";
import BaseCommand from "../../utils/structures/BaseCommand";

// export class TwitchCustomCommandInfo {
//   @prop({ required: true })
//   name!: string
//   @prop({})
//   channel!: string
// }
// export class TwitchCustomCommand {
//   _id?: mongoose.Types.ObjectId;
//   @prop({ required: true, unique: true })
//   public info!: TwitchCustomCommandInfo;
//   @prop({ default: [], type: [String] })
//   public aliases?: string[];
//   @prop({ required: true })
//   public response!: string;
//   @prop({ default: false })
//   public replyInDM?: false;
// }
// export const CustomCommandModel = getModelForClass(TwitchCustomCommand)

export class TwitchCustomCommandInfo {
  _id?: mongoose.Types.ObjectId;
  @prop({ required: true })
  name!: string
  @prop({ required: true })
  channel!: string
  // TODO: maybe convert to a ObjectID that references the channel config?
}
export class TwitchCustomCommand {
  _id!: mongoose.Types.ObjectId;
  @prop({ required: true, unique: true })
  public info!: TwitchCustomCommandInfo;
  @prop({})
  public alias?: mongoose.Types.ObjectId;
  @prop({})
  public response?: string;
  @prop({ default: false })
  public replyInDM?: false;
}
export const TwitchCustomCommandModel = getModelForClass(TwitchCustomCommand)
