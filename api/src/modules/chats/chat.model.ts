import { Schema, model, Types, type InferSchemaType } from 'mongoose';

const chatSchema = new Schema(
  {
    /** Anonymous / device-bound chats */
    deviceId: { type: String, index: true },
    /** Logged-in user chats (persist across devices) */
    userId: { type: String, index: true, sparse: true },
    typeId: { type: Types.ObjectId, ref: 'ConversationType', required: true },
    mode: { type: String, enum: ['role_play', 'free_chat'], required: true },
    learningLanguageName: { type: String, required: true },
    /** Built once at chat create — never require client to resend every message. */
    systemInstruction: { type: String, required: true },
    title: { type: String, required: true },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

chatSchema.index({ deviceId: 1, lastMessageAt: -1 });
chatSchema.index({ userId: 1, lastMessageAt: -1 });

export type ChatDoc = InferSchemaType<typeof chatSchema> & { _id: Schema.Types.ObjectId };
export const ChatModel = model('Chat', chatSchema);
