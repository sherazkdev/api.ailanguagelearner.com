import { Types } from 'mongoose';
import { TopicModel } from './topic.model.js';
import { conversationTypesService } from '../conversation-types/conversation-types.service.js';
import { AppError } from '../../shared/errors.js';
import { parseObjectId } from '../../shared/object-id.js';

export const topicsService = {
  async listByTypeSlugOrId(slugOrId: string) {
    const type = await conversationTypesService.getBySlugOrId(slugOrId);
    if (type.slug === 'ai-conversation') {
      throw new AppError(400, 'AI Conversation has no topics — use mode free_chat');
    }

    const topics = await TopicModel.find({ typeId: type._id, isActive: true })
      .sort({ sortOrder: 1 })
      .select('_id slug title description sortOrder typeId')
      .lean();

    return {
      type: {
        _id: type._id,
        slug: type.slug,
        title: type.title,
      },
      topics,
    };
  },

  async getByIdForType(topicId: string, typeId: Types.ObjectId) {
    const id = parseObjectId(topicId, 'topicId');
    const topic = await TopicModel.findOne({ _id: id, typeId, isActive: true }).lean();
    if (!topic) throw new AppError(404, 'Topic not found for this conversation type');
    return topic;
  },
};
