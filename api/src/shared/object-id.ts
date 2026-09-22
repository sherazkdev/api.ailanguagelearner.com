import { Types } from 'mongoose';
import { AppError } from './errors.js';

export function parseObjectId(value: string, label = 'id'): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(400, `Invalid ${label}`);
  }
  return new Types.ObjectId(value);
}
