import { getModelForClass, index, modelOptions, mongoose, prop, queryMethod, ReturnModelType } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { QueryMethod } from "@typegoose/typegoose/lib/types";

// @modelOptions({
//   schemaOptions: {
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true }
//   }
// })

@modelOptions({ schemaOptions: { collection: 'choob_quotes', timestamps: true } })
export class ChoobQuote {
  _id?: mongoose.Types.ObjectId;
  public createdAt?: Date;
  public updatedAt?: Date;
  @prop({ required: true, unique: true })
  public quote?: string;
  @prop({ required: true })
  public author?: string;
  @prop({ required: true })
  public authorId?: string;

}
export const ChoobQuoteModel = getModelForClass(ChoobQuote)