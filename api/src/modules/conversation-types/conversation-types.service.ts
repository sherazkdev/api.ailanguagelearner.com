import { ConversationTypeModel } from './conversation-type.model.js';
import { AppError } from '../../shared/errors.js';

export const conversationTypesService = {
  async list(filter?: string) {
    const q: Record<string, unknown> = { isActive: true };
    if (filter && filter !== 'all') q.filterGroup = filter;
    return ConversationTypeModel.find(q).sort({ sortOrder: 1 }).lean();
  },

  async getBySlugOrId(slugOrId: string) {
    const type =
      slugOrId.match(/^[a-f\d]{24}$/i)
        ? await ConversationTypeModel.findById(slugOrId)
        : await ConversationTypeModel.findOne({ slug: slugOrId });
    if (!type || !type.isActive) throw new AppError(404, 'Conversation type not found');
    return type;
  },

  async create(input: {
    slug: string;
    title: string;
    description: string;
    iconKey: string;
    filterGroup: string;
    sortOrder?: number;
  }) {
    const exists = await ConversationTypeModel.findOne({ slug: input.slug });
    if (exists) throw new AppError(409, 'Slug already exists');
    return ConversationTypeModel.create({
      ...input,
      isActive: true,
    });
  },

  async update(id: string, patch: Record<string, unknown>) {
    const type = await ConversationTypeModel.findByIdAndUpdate(id, { $set: patch }, { new: true });
    if (!type) throw new AppError(404, 'Conversation type not found');
    return type;
  },
};
