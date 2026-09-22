import { z } from 'zod';
import { AppError } from './errors.js';

/** Client identity: anonymous users send deviceId; logged-in users send userId (optionally with deviceId too). */
export type OwnerIdentity = {
  deviceId?: string;
  userId?: string;
};

const ownerIdentityFields = {
  deviceId: z.string().min(3).max(200).optional(),
  userId: z.string().min(1).max(200).optional(),
};

const requireOneIdentity = (value: OwnerIdentity) => Boolean(value.deviceId || value.userId);

/** Base object schema — use .extend() in routes before .refine(). */
export const ownerIdentityFieldsSchema = z.object(ownerIdentityFields);

export const ownerIdentityBodySchema = ownerIdentityFieldsSchema.refine(requireOneIdentity, {
  message: 'deviceId or userId is required',
});

export const ownerIdentityQuerySchema = ownerIdentityFieldsSchema.refine(requireOneIdentity, {
  message: 'deviceId or userId is required',
});

/** Mongo filter: logged-in users are matched by userId; otherwise by deviceId. */
export function buildOwnerFilter(identity: OwnerIdentity): Record<string, string> {
  if (identity.userId) {
    return { userId: identity.userId };
  }
  if (identity.deviceId) {
    return { deviceId: identity.deviceId };
  }
  throw new AppError(400, 'deviceId or userId is required');
}

export function assertOwnerIdentity(identity: OwnerIdentity): void {
  if (!identity.deviceId && !identity.userId) {
    throw new AppError(400, 'deviceId or userId is required');
  }
}
