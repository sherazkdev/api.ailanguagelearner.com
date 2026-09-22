import { Schema, model, type InferSchemaType } from 'mongoose';

const conversationTypeSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    iconKey: { type: String, required: true },
    filterGroup: {
      type: String,
      enum: ['all', 'daily_life', 'work', 'travel', 'other'],
      default: 'other',
    },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type ConversationTypeDoc = InferSchemaType<typeof conversationTypeSchema> & {
  _id: Schema.Types.ObjectId;
};
export const ConversationTypeModel = model('ConversationType', conversationTypeSchema);
