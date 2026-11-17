import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Product extends Document {
  @Prop({ type: String, required: true })
  name: string;

   @Prop({ type: Number, required: true }) 
  price: number;

  @Prop({ type: String, required: true })
  image: string; // We will store the image URL here
}

export const ProductSchema = SchemaFactory.createForClass(Product);