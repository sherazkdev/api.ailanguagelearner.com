import { Types } from 'mongoose';
import { ChatModel } from './chat.model.js';
import { MessageModel } from './message.model.js';
import { conversationTypesService } from '../conversation-types/conversation-types.service.js';
import { topicsService } from '../topics/topics.service.js';
import { usersService } from '../users/users.service.js';
import {
  buildFreeChatPrompt,
  buildRolePlayPrompt,
  difficultyGuideForKey,
} from '../../shared/prompts.js';
import { generateReply } from '../../shared/groq.js';
import { AppError } from '../../shared/errors.js';
import {
  assertOwnerIdentity,
  buildOwnerFilter,
  type OwnerIdentity,
} from '../../shared/owner-identity.js';
import { parseObjectId } from '../../shared/object-id.js';

const DIFFICULTY_LABELS: Record<string, string> = {
  dl_beginner: 'Beginner',
  dl_intermediate: 'Intermediate',
  dl_advanced: 'Advanced',
};

function chatOwnerFilter(chatId: string, identity: OwnerIdentity) {
  return { _id: parseObjectId(chatId, 'chatId'), ...buildOwnerFilter(identity) };
}

export const chatsService = {
  async listByOwner(identity: OwnerIdentity) {
    return ChatModel.find(buildOwnerFilter(identity))
      .sort({ lastMessageAt: -1 })
      .select('-systemInstruction')
      .populate('typeId', 'title slug iconKey filterGroup')
      .populate('topicId', 'title slug')
      .lean();
  },

  async getOne(chatId: string, identity: OwnerIdentity) {
    const chat = await ChatModel.findOne(chatOwnerFilter(chatId, identity))
      .select('-systemInstruction')
      .populate('typeId', 'title slug iconKey')
      .populate('topicId', 'title slug')
      .lean();
    if (!chat) throw new AppError(404, 'Chat not found');
    return chat;
  },

  async create(input: OwnerIdentity & {
    mode: 'role_play' | 'free_chat';
    learningLanguageName: string;
    typeId?: string;
    topicId?: string;
    difficultyKey?: string;
  }) {
    assertOwnerIdentity(input);
    await usersService.touch(input);

    const language = input.learningLanguageName.trim().slice(0, 80);
    if (!language) throw new AppError(400, 'learningLanguageName is required');

    let systemInstruction: string;
    let title: string;
    let typeId: Types.ObjectId;
    let topicId: Types.ObjectId | undefined;

    if (input.mode === 'free_chat') {
      if (input.topicId) {
        throw new AppError(400, 'free_chat does not use topicId — start direct chat');
      }
      const freeType = await conversationTypesService.getBySlugOrId('ai-conversation');
      typeId = freeType._id as Types.ObjectId;
      title = 'AI Conversation';
      systemInstruction = buildFreeChatPrompt(language);
    } else {
      if (!input.typeId) throw new AppError(400, 'role_play requires typeId');
      if (!input.topicId) throw new AppError(400, 'role_play requires topicId');

      const type = await conversationTypesService.getBySlugOrId(input.typeId);
      if (type.slug === 'ai-conversation') {
        throw new AppError(400, 'Use mode free_chat for AI Conversation type');
      }

      typeId = type._id as Types.ObjectId;
      const topic = await topicsService.getByIdForType(input.topicId, typeId);
      topicId = topic._id as Types.ObjectId;
      title = topic.title;

      const difficultyKey = input.difficultyKey ?? 'dl_beginner';
      systemInstruction = buildRolePlayPrompt({
        topicTitle: topic.title,
        topicDescription: topic.description,
        learningLanguageName: language,
        difficultyLabel: DIFFICULTY_LABELS[difficultyKey] ?? 'Beginner',
        difficultyGuide: difficultyGuideForKey(difficultyKey),
      });
    }

    const chat = await ChatModel.create({
      deviceId: input.deviceId,
      userId: input.userId,
      typeId,
      topicId,
      mode: input.mode,
      learningLanguageName: language,
      systemInstruction,
      title,
    });

    return {
      id: chat._id,
      deviceId: chat.deviceId ?? undefined,
      userId: chat.userId ?? undefined,
      mode: chat.mode,
      title: chat.title,
      typeId: chat.typeId,
      topicId: chat.topicId ?? undefined,
      learningLanguageName: chat.learningLanguageName,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  },

  async listMessages(chatId: string, identity: OwnerIdentity) {
    const chat = await ChatModel.findOne(chatOwnerFilter(chatId, identity)).lean();
    if (!chat) throw new AppError(404, 'Chat not found');
    const messages = await MessageModel.find({ chatId })
      .sort({ createdAt: 1 })
      .select('role text createdAt')
      .lean();
    return { chatId, title: chat.title, mode: chat.mode, messages };
  },

  async sendMessage(chatId: string, identity: OwnerIdentity, userMessage: string) {
    const chat = await ChatModel.findOne(chatOwnerFilter(chatId, identity));
    if (!chat) throw new AppError(404, 'Chat not found');

    const prior = await MessageModel.find({ chatId: chat._id })
      .sort({ createdAt: 1 })
      .select('role text')
      .lean();

    const history = prior.map((m) => ({
      text: m.text,
      isUser: m.role === 'user',
    }));

    const text = await generateReply({
      systemInstruction: chat.systemInstruction,
      userMessage,
      history,
    });

    if (text == null) {
      return { text: null as string | null };
    }

    await MessageModel.insertMany([
      { chatId: chat._id, role: 'user', text: userMessage },
      { chatId: chat._id, role: 'model', text },
    ]);
    chat.lastMessageAt = new Date();
    await chat.save();

    return { text };
  },

  async remove(chatId: string, identity: OwnerIdentity) {
    const chat = await ChatModel.findOneAndDelete(chatOwnerFilter(chatId, identity));
    if (!chat) throw new AppError(404, 'Chat not found');
    await MessageModel.deleteMany({ chatId: chat._id });
    return { deleted: true };
  },
};
