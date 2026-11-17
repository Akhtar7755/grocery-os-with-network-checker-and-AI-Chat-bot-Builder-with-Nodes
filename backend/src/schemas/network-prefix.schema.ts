import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class NetworkPrefix extends Document {
  @Prop({ required: true, unique: true })
  prefix: string;

  @Prop({ required: true })
  networkName: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const NetworkPrefixSchema = SchemaFactory.createForClass(NetworkPrefix);