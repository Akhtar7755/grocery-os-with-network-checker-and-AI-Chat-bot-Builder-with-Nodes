import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Chatbot extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Object, required: true })
  flow: any;

  @Prop({ default: Date.now })
  createdAt: Date;
}
export const ChatbotSchema = SchemaFactory.createForClass(Chatbot);

// Conversation memory, one document per (bot + chat session + memory node)
@Schema()
export class ChatMemory extends Document {
  @Prop({ required: true, unique: true, index: true })
  key: string;

  @Prop({ type: [{ role: String, content: String }], default: [] })
  messages: { role: 'user' | 'assistant'; content: string }[];

  @Prop({ default: Date.now })
  updatedAt: Date;
}
export const ChatMemorySchema = SchemaFactory.createForClass(ChatMemory);