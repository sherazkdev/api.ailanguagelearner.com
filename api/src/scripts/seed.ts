import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ConversationTypeModel } from '../modules/conversation-types/conversation-type.model.js';

const TYPES = [
  {
    slug: 'daily-life',
    title: 'Daily Life',
    description: 'Practice everyday conversations.',
    iconKey: 'coffee',
    filterGroup: 'daily_life' as const,
    sortOrder: 1,
  },
  {
    slug: 'work-career',
    title: 'Work & Career',
    description: 'Improve your professional communication.',
    iconKey: 'briefcase',
    filterGroup: 'work' as const,
    sortOrder: 2,
  },
  {
    slug: 'travel-vacation',
    title: 'Travel & Vacation',
    description: 'Speak confidently while traveling.',
    iconKey: 'airplane',
    filterGroup: 'travel' as const,
    sortOrder: 3,
  },
  {
    slug: 'friends-family',
    title: 'Friends & Family',
    description: 'Chat about relationships and life.',
    iconKey: 'people',
    filterGroup: 'other' as const,
    sortOrder: 4,
  },
  {
    slug: 'shopping',
    title: 'Shopping',
    description: 'Learn useful phrases for shopping.',
    iconKey: 'bag',
    filterGroup: 'daily_life' as const,
    sortOrder: 5,
  },
  {
    slug: 'health-lifestyle',
    title: 'Health & Lifestyle',
    description: 'Talk about health and well-being.',
    iconKey: 'heart',
    filterGroup: 'other' as const,
    sortOrder: 6,
  },
  {
    slug: 'education',
    title: 'Education',
    description: 'Discuss studies and learning.',
    iconKey: 'graduation',
    filterGroup: 'other' as const,
    sortOrder: 7,
  },
  {
    slug: 'entertainment',
    title: 'Entertainment',
    description: 'Talk about movies, music and more.',
    iconKey: 'star',
    filterGroup: 'other' as const,
    sortOrder: 8,
  },
  {
    slug: 'ai-conversation',
    title: 'AI Conversation',
    description: 'Open Q&A with your language tutor.',
    iconKey: 'spark',
    filterGroup: 'other' as const,
    sortOrder: 9,
  },
];

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  await ConversationTypeModel.deleteMany({});
  await ConversationTypeModel.insertMany(TYPES.map((t) => ({ ...t, isActive: true })));
  const typeCount = await ConversationTypeModel.countDocuments();
  console.log(`Seed complete: ${typeCount} conversation types`);
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
