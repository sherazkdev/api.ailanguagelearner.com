import { UserModel } from './user.model.js';
import { AppError } from '../../shared/errors.js';
import {
  assertOwnerIdentity,
  buildOwnerFilter,
  type OwnerIdentity,
} from '../../shared/owner-identity.js';

function upsertFilter(identity: OwnerIdentity): Record<string, string> {
  assertOwnerIdentity(identity);
  if (identity.userId) {
    return { userId: identity.userId };
  }
  return { deviceId: identity.deviceId! };
}

function upsertSet(identity: OwnerIdentity, extra: Record<string, unknown>) {
  const $set: Record<string, unknown> = { ...extra, lastSeenAt: new Date() };
  if (identity.deviceId) $set.deviceId = identity.deviceId;
  if (identity.userId) $set.userId = identity.userId;
  return $set;
}

export const usersService = {
  async subscribe(input: OwnerIdentity & {
    subscriptionActive: boolean;
    subscriptionProvider: string;
  }) {
    assertOwnerIdentity(input);
    const user = await UserModel.findOneAndUpdate(
      upsertFilter(input),
      { $set: upsertSet(input, {
        subscriptionActive: input.subscriptionActive,
        subscriptionProvider: input.subscriptionProvider,
      }) },
      { upsert: true, new: true },
    ).lean();
    return user;
  },

  async getByDeviceId(deviceId: string) {
    const user = await UserModel.findOne({ deviceId }).lean();
    if (!user) throw new AppError(404, 'User not found');
    return user;
  },

  async getByUserId(userId: string) {
    const user = await UserModel.findOne({ userId }).lean();
    if (!user) throw new AppError(404, 'User not found');
    return user;
  },

  async touch(identity: OwnerIdentity) {
    assertOwnerIdentity(identity);
    await UserModel.findOneAndUpdate(
      upsertFilter(identity),
      {
        $set: upsertSet(identity, {}),
        $setOnInsert: { subscriptionActive: false, subscriptionProvider: 'google' },
      },
      { upsert: true },
    );
  },

  buildOwnerFilter,
};
