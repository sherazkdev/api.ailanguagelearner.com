import { Schema, model, Types, type InferSchemaType } from 'mongoose';

const topicSchema = new Schema(
  {
    typeId: { type: Types.ObjectId, ref: 'ConversationType', required: true, index: true },
    slug: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

topicSchema.index({ typeId: 1, slug: 1 }, { unique: true });
topicSchema.index({ typeId: 1, sortOrder: 1, isActive: 1 });

export type TopicDoc = InferSchemaType<typeof topicSchema> & { _id: Schema.Types.ObjectId };
export const TopicModel = model('Topic', topicSchema);
