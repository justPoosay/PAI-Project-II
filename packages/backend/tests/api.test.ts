import type { UserMessage } from 'common';
import { ObjectId } from 'mongodb';
import { getAvailableModels } from '../src/core/utils';
import { ConversationService } from '../src/lib/db';
import { appRouter } from '../src/trpc';

const usedUserIDs: ObjectId[] = [];

function getUnauthedCaller() {
  return appRouter.createCaller({
    req: new Request('http://localhost:3000'),
    resHeaders: new Headers(),
    auth: null
  });
}

function getCaller() {
  const id = new ObjectId();
  usedUserIDs.push(id);

  return appRouter.createCaller({
    req: new Request('http://localhost:3000'),
    resHeaders: new Headers(),
    auth: {
      session: {
        id: '?',
        userId: '?',
        token: '?',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date()
      },
      user: {
        id: id.toHexString(),
        email: '?',
        name: '?',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  });
}

test('unauthenticated user can get available models', async () => {
  const models = await getUnauthedCaller().model.available();
  expect(models).toBeInstanceOf(Array);
  expect(models.length).toBeGreaterThan(0);
});

describe('authenticated user conversation lifecycle', () => {
  const trpc = getCaller();

  let id: string;

  test('can create a new conversation', async () => {
    const c = await trpc.conversation.new({
      model: getAvailableModels()[0]
    });

    expect(c).toBeDefined();
    expect(c.deleted).toBe(false);
    expect(c.messages).toBeDefined();
    expect(c.messages.length).toBe(0);
  });

  test('can list conversations', async () => {
    const conversations = await trpc.conversation.list();
    expect(conversations).toBeDefined();
    expect(conversations.length).toBeGreaterThan(0);

    const _id = conversations[0]!._id;
    id = _id instanceof ObjectId ? _id.toHexString() : _id;
  });

  test('can get a completion stream', async () => {
    const stream = await trpc.completion({
      for: id,
      message: 'haii :3'
    });
    expect(stream).toBeDefined();

    for await (const chunk of stream) {
      expect(chunk).toBeDefined();
      if (chunk) {
        expect(chunk).toHaveProperty('type');
      } else {
        expect(chunk).toBeNull();
      }
    }
  });

  test('can retrieve messages for a conversation', async () => {
    const messages = await trpc.conversation.messages({ id });

    expect(messages).toBeDefined();
    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages[0]!.role).toBe('user');
    expect((messages[0] as typeof UserMessage.infer).content).toBe('haii :3');
  });

  test('can modify a conversation', async () => {
    const conversation = await trpc.conversation.modify({
      id,
      name: 'test',
      model: 'gpt-4o-mini',
      reasoningEffort: 'high'
    });

    expect(conversation).toBeDefined();
    expect(conversation!.name).toBe('test');
    expect(conversation!.model).toBe('gpt-4o-mini');
    expect(conversation!.reasoningEffort).toBe('high');
  });

  test('can delete a conversation', async () => {
    await trpc.conversation.delete({ id });

    const conversations = await trpc.conversation.list();
    expect(conversations).toBeDefined();
    expect(conversations.length).toBe(1);
    expect(conversations[0]!.deleted).toBe(true);
  });
});

afterAll(async () => {
  // Clean up conversations created by tests
  await ConversationService.deleteMany({ userId: { $in: usedUserIDs } });
});
