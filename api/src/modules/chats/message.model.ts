import { Schema, model, Types, type InferSchemaType } from 'mongoose';

const messageSchema = new Schema(
  {
    chatId: { type: Types.ObjectId, ref: 'Chat', required: true, index: true },
    role: { type: String, enum: ['user', 'model'], required: true },
    text: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

messageSchema.index({ chatId: 1, createdAt: 1 });

export type MessageDoc = InferSchemaType<typeof messageSchema> & { _id: Schema.Types.ObjectId };
export const MessageModel = model('Message', messageSchema);
