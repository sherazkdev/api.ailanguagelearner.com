import { Types } from 'mongoose';
import { ChatModel } from './chat.model.js';
import { MessageModel } from './message.model.js';
import { conversationTypesService } from '../conversation-types/conversation-types.service.js';
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

const DIFFICULTY_LABELS: Record<string, string> = {
  dl_beginner: 'Beginner',
  dl_intermediate: 'Intermediate',
  dl_advanced: 'Advanced',
};

function chatOwnerFilter(chatId: string, identity: OwnerIdentity) {
  return { _id: chatId, ...buildOwnerFilter(identity) };
}

function toChatResponse(chat: {
  _id: Types.ObjectId;
  deviceId?: string | null;
  userId?: string | null;
  mode: string;
  title: string;
  typeId: Types.ObjectId;
  learningLanguageName: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: chat._id,
    deviceId: chat.deviceId ?? undefined,
    userId: chat.userId ?? undefined,
    mode: chat.mode,
    title: chat.title,
    typeId: chat.typeId,
    learningLanguageName: chat.learningLanguageName,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
  };
}

export const chatsService = {
  async listByOwner(identity: OwnerIdentity) {
    return ChatModel.find(buildOwnerFilter(identity))
      .sort({ lastMessageAt: -1 })
      .select('-systemInstruction')
      .populate('typeId', 'title slug iconKey filterGroup')
      .lean();
  },

  async getOne(chatId: string, identity: OwnerIdentity) {
    const chat = await ChatModel.findOne(chatOwnerFilter(chatId, identity))
      .select('-systemInstruction')
      .populate('typeId', 'title slug iconKey')
      .lean();
    if (!chat) throw new AppError(404, 'Chat not found');
    return chat;
  },

  async create(input: OwnerIdentity & {
    mode: 'role_play' | 'free_chat';
    learningLanguageName: string;
    typeId?: string;
    difficultyKey?: string;
  }) {
    assertOwnerIdentity(input);
    await usersService.touch(input);

    let systemInstruction: string;
    let title: string;
    let typeId: Types.ObjectId;

    if (input.mode === 'free_chat') {
      const freeType = await conversationTypesService.getBySlugOrId('ai-conversation');
      typeId = freeType._id as Types.ObjectId;
      title = 'AI Conversation';
      systemInstruction = buildFreeChatPrompt(input.learningLanguageName);
    } else {
      if (!input.typeId) {
        throw new AppError(400, 'role_play requires typeId');
      }
      const type = await conversationTypesService.getBySlugOrId(input.typeId);
      if (type.slug === 'ai-conversation') {
        throw new AppError(400, 'Use mode free_chat for AI Conversation type');
      }
      const difficultyKey = input.difficultyKey ?? 'dl_beginner';
      typeId = type._id as Types.ObjectId;
      title = type.title;
      systemInstruction = buildRolePlayPrompt({
        topicTitle: type.title,
        topicDescription: type.description,
        learningLanguageName: input.learningLanguageName,
        difficultyLabel: DIFFICULTY_LABELS[difficultyKey] ?? 'Beginner',
        difficultyGuide: difficultyGuideForKey(difficultyKey),
      });
    }

    const chat = await ChatModel.create({
      deviceId: input.deviceId,
      userId: input.userId,
      typeId,
      mode: input.mode,
      learningLanguageName: input.learningLanguageName,
      systemInstruction,
      title,
    });

    return toChatResponse(chat);
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
