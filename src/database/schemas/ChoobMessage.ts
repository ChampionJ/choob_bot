import { getModelForClass, index, modelOptions, mongoose, prop, queryMethod, ReturnModelType } from "@typegoose/typegoose";
import { QueryMethod } from "@typegoose/typegoose/lib/types";

// @modelOptions({
//   schemaOptions: {
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true }
//   }
// })
export class ChoobMessage {
  _id?: mongoose.Types.ObjectId;
  @prop({ required: true, unique: true })
  public message?: string;

}
export const ChoobMessageModel = getModelForClass(ChoobMessage)