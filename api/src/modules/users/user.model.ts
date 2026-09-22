import { Schema, model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    /** Anonymous / pre-login subscription identity */
    deviceId: { type: String, unique: true, sparse: true, index: true },
    /** Logged-in account identity (Firebase / auth uid) */
    userId: { type: String, unique: true, sparse: true, index: true },
    subscriptionActive: { type: Boolean, default: false },
    subscriptionProvider: { type: String, default: 'google' },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Schema.Types.ObjectId };
export const UserModel = model('User', userSchema);
