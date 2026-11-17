import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class SmsList extends Document {
  @Prop({ required: true })
  listName: string;

  @Prop({ type: [String], required: true })
  numbers: string[];

  @Prop({ required: true })
  totalCount: number; // <-- YEH FIELD ADD KAREIN

  @Prop({ required: true })
  network: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const SmsListSchema = SchemaFactory.createForClass(SmsList);