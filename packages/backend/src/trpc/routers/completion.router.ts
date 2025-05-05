import { streamText } from 'ai';
import { type } from 'arktype';
import { redis } from 'bun';
import { models, type MessageChunk } from 'common';
import { ObjectId } from 'mongodb';
import { stringify } from 'superjson';
import { getTextContent } from '../../core/utils';
import { ChatService } from '../../lib/db';
import { env } from '../../lib/env';
import { getLimits } from '../../lib/stripe';
import { protectedProcedure } from '../trpc';

export const completionRouter = protectedProcedure
  .input(
    type({
      message: 'string>0',
      for: 'string.hex==24',
      'preferences?': {
        name: 'string',
        occupation: 'string',
        selectedTraits: 'string',
        additionalInfo: 'string'
      }
    })
  )
  .query(async function* ({ input, ctx, signal }) {
    const limits = await getLimits(ctx.auth.user);
    const messagesPerMonth =
      limits.tier === 'pro' ? env.VITE_MESSAGES_PER_MONTH_PAID : env.VITE_MESSAGES_PER_MONTH_FREE;
    if (limits.messagesUsed >= messagesPerMonth) {
      yield {
        type: 'error',
        message: 'You have reached your message limit for this month.'
      } as const;
      return;
    } else {
      limits.messagesUsed += 1;
    }

    const _id = new ObjectId(input.for);
    const c = await ChatService.findOne({
      _id,
      deleted: false,
      userId: new ObjectId(ctx.auth.user.id)
    });
    if (!c) return;

    const model = c.model ?? 'o4-mini';
    const reasoningEffort = c.reasoningEffort;

    c.messages.push({ role: 'user', content: input.message });
    c.messages.push({ role: 'assistant', chunks: [], author: model });

    await ChatService.updateOne({ _id }, { messages: c.messages });

    let prompt = `You are an AI assistant powered by the ${models[model].name} model. You are here to help and engage in conversation. Feel free to mention that you're using the ${models[model].name} model if asked.`;

    // TODO: math toggle?
    prompt += ` If you are generating responses with math, you should use LaTeX, wrapped in $$.`;

    // TODO: code toggle?
    prompt += ` If you are generating code, you should make it Prettier formatted and print width should be 80 characters.`;

    if (input.preferences?.name) {
      prompt += ` You're speaking with ${input.preferences.name}.`;
    }

    if (input.preferences?.occupation) {
      prompt += ` The user's occupation is ${input.preferences.occupation}.`;
    }

    if (input.preferences?.selectedTraits) {
      prompt += ` The user has requested that you behave in the following ways: ${input.preferences.selectedTraits}.`;
    }

    if (input.preferences?.additionalInfo) {
      prompt += ` Additional information about the user: ${input.preferences.additionalInfo}. Use this information to provide more personalized responses.`;
    }

    prompt += ` Always strive to be helpful, respectful and engaging in your interactions.`;

    const options: Parameters<typeof streamText>[0] = {
      model: models[model].provider.it,
      messages: c.messages.map(m =>
        m.role === 'user' ? m : { role: 'assistant', content: getTextContent(m.chunks) }
      ),
      abortSignal: signal,
      system: prompt
    };

    if (model === 'claude-3-7-sonnet-thinking' && reasoningEffort) {
      let budgetTokens = 1024;
      if (reasoningEffort === 'medium') budgetTokens = 2048;
      if (reasoningEffort === 'high') budgetTokens = 4096;

      options.providerOptions = {
        anthropic: {
          thinking: {
            type: 'enabled',
            budgetTokens
          }
        }
      };
    }

    if ((model === 'o4-mini' || model === 'o3-mini') && reasoningEffort) {
      options.providerOptions = {
        openai: {
          reasoningEffort
        }
      };
    }

    if (model === 'gemini-2.5-flash-thinking' && reasoningEffort) {
      let max_tokens = 1024;
      if (reasoningEffort === 'medium') max_tokens = 2048;
      if (reasoningEffort === 'high') max_tokens = 4096;

      options.providerOptions = {
        openrouter: {
          max_tokens
        }
      };
    }

    await redis.set(`user:limits:${ctx.auth.user.id}`, stringify(limits));

    const stream = streamText(options);

    try {
      for await (const chunk of stream.fullStream) {
        if (
          chunk.type !== 'tool-call' &&
          chunk.type !== 'text-delta' &&
          chunk.type !== 'reasoning'
        ) {
          continue;
        }

        const last = c.messages.at(-1)!;
        if (last.role === 'assistant') {
          last.chunks.push(chunk);
        }

        yield chunk;
      }

      const last = c.messages.at(-1)!;
      if (last.role === 'assistant') {
        last.chunks.push(null);
      }

      yield null;
    } catch (err) {
      const message =
        err instanceof Error && err.name === 'AbortError' ? 'Aborted by user' : `${err}`;
      const errorChunk: MessageChunk = { type: 'error', message };
      const last = c.messages.at(-1)!;
      if (last.role === 'assistant') {
        last.chunks.push(errorChunk);
      }
      yield errorChunk;
    } finally {
      await ChatService.updateOne({ _id }, { messages: c.messages });
    }
  });
