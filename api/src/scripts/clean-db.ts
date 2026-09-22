import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ConversationTypeModel } from '../modules/conversation-types/conversation-type.model.js';
import { TopicModel } from '../modules/topics/topic.model.js';
import { ChatModel } from '../modules/chats/chat.model.js';
import { MessageModel } from '../modules/chats/message.model.js';
import { UserModel } from '../modules/users/user.model.js';

async function cleanDb() {
  await mongoose.connect(env.MONGODB_URI);
  const [users, chats, messages, topics, types] = await Promise.all([
    UserModel.deleteMany({}),
    ChatModel.deleteMany({}),
    MessageModel.deleteMany({}),
    TopicModel.deleteMany({}),
    ConversationTypeModel.deleteMany({}),
  ]);
  console.log(
    `DB cleaned: ${users.deletedCount} users, ${chats.deletedCount} chats, ${messages.deletedCount} messages, ${topics.deletedCount} topics, ${types.deletedCount} types`,
  );
  await mongoose.disconnect();
}

cleanDb().catch((e) => {
  console.error(e);
  process.exit(1);
});
