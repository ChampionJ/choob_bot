import { mongoose } from "@typegoose/typegoose";

export interface IChoobQuote {
  //* Required and Unique Properties
  _id: mongoose.Types.ObjectId;
  quote: string;

  //* Required Properties
  createdAt: Date;
  updatedAt: Date;
  author: string;
  authorId: string;
}