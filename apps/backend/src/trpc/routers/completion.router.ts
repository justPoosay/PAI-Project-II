import { streamText } from 'ai';
import { type } from 'arktype';
import { redis } from 'bun';
import { Effort, models, type MessageChunk } from 'common';
import { includes } from 'common/utils';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { ObjectId } from 'mongodb';
import { stringify } from 'superjson';
import { tools } from '../../core/tools';
import { getAvailableModels, getTextContent } from '../../core/utils';
import { ChatService } from '../../lib/db';
import { env } from '../../lib/env';
import { logger } from '../../lib/logger';
import { getLimits } from '../../lib/stripe';
import { protectedProcedure } from '../trpc';

dayjs.extend(timezone);
dayjs.extend(utc);

export const completionRouter = protectedProcedure
  .input(
    type.and(
      type.or(
        { message: 'string>0' }, // completion
        { messageIndex: 'number' }, // retry
        { message: 'string>0', messageIndex: 'number' } // edit & retry
      ),
      {
        'preferences?': {
          name: 'string',
          occupation: 'string',
          selectedTraits: 'string',
          additionalInfo: 'string'
        },
        'system?': 'string',
        id: 'string.hex==24',
        model: type.or(...getAvailableModels().map(v => `'${v}'` as const)),
        reasoningEffort: Effort
      }
    )
  )
  .query(async function* ({ input, ctx, signal }) {
    const limits = await getLimits(ctx.auth.user);
    const messagesPerMonth =
      limits.tier === 'pro' ? env.VITE_MESSAGES_PER_MONTH_PAID : env.VITE_MESSAGES_PER_MONTH_FREE;
    if (limits.messagesUsed >= messagesPerMonth) {
      return;
    }
    limits.messagesUsed += 1;

    const _id = new ObjectId(input.id);
    const c = await ChatService.findOne({
      _id,
      deleted: false,
      userId: new ObjectId(ctx.auth.user.id)
    });
    if (!c) return;

    if ('message' in input && 'messageIndex' in input) {
      const message = c.messages.at(input.messageIndex);
      // TODO: editing assistant messages
      if (!message || message.role === 'assistant') return;
      c.messages = c.messages.slice(0, input.messageIndex);
      c.messages.push({ role: 'user', content: input.message });
    } else if ('message' in input) {
      c.messages.push({ role: 'user', content: input.message });
    } else {
      const message = c.messages.at(input.messageIndex);
      if (!message) return;
      if (message.role === 'user') {
        c.messages = c.messages.slice(0, input.messageIndex + 1);
      } else {
        c.messages = c.messages.slice(0, input.messageIndex);
      }
    }

    c.model = input.model;
    c.reasoningEffort = input.reasoningEffort;

    await ChatService.updateOne({ _id }, { messages: c.messages });

    let prompt: string | undefined;
    if (input.system) {
      prompt = input.system;
    } else {
      prompt = `You are an AI assistant powered by the ${models[c.model].name} model. You are here to help and engage in conversation. Feel free to mention that you're using the ${models[c.model].name} model if asked.`;

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

      prompt += ` Always strive to be helpful, respectful and engaging in your interactions. The current date and time is ${dayjs().tz('America/Los_Angeles').format('h:mm A on MMMM D, YYYY PST')}`;
    }

    let max_tokens = 1024;
    if (c.reasoningEffort === 'medium') max_tokens = 2048;
    if (c.reasoningEffort === 'high') max_tokens = 4096;

    const providerRaw = models[c.model].provider;
    const provider = Array.isArray(providerRaw) ? providerRaw.find(p => env[p.env])! : providerRaw;

    const options: Parameters<typeof streamText<typeof tools>>[0] = {
      model: provider.it,
      messages: c.messages.map(m =>
        m.role === 'user' ? m : { role: 'assistant', content: getTextContent(m.chunks) }
      ),
      abortSignal: signal,
      system: prompt,
      tools,
      maxSteps: limits.tier === 'pro' ? 100 : 10,
      maxRetries: 3
    };

    if (includes(models[c.model].capabilities, 'effortControl')) {
      if (c.model === 'claude-3-7-sonnet-thinking') {
        options.providerOptions = {
          anthropic: {
            thinking: {
              type: 'enabled',
              budgetTokens: max_tokens
            }
          }
        };
        if (provider.env === 'OPENROUTER_API_KEY') {
          (options.model as typeof provider.it).settings.reasoning = {
            max_tokens
          };
        }
      } else {
        options.providerOptions = {
          openai: {
            reasoningEffort: c.reasoningEffort
          }
        };
        if (provider.env === 'OPENROUTER_API_KEY') {
          (options.model as typeof provider.it).settings.reasoning = {
            effort: c.reasoningEffort
          };
        }
      }
    }

    await redis.set(`user:limits:${ctx.auth.user.id}`, stringify(limits));

    const chunks: MessageChunk[] = [];

    try {
      const stream = streamText(options);
      let reasoning = false;
      for await (let chunk of stream.fullStream) {
        if (chunk.type === 'finish') {
          if (chunk.finishReason === 'error') {
            const errorChunk: MessageChunk = {
              type: 'error',
              message: 'An error occurred while generating the response'
            };
            chunks.push(errorChunk);
            yield errorChunk;
            continue;
          }

          chunks.push(null);
          yield null;
          continue;
        }

        if (
          chunk.type !== 'tool-call' &&
          chunk.type !== 'text-delta' &&
          chunk.type !== 'reasoning' &&
          chunk.type !== 'tool-result'
        ) {
          continue;
        }

        if (chunk.type === 'text-delta' && chunk.textDelta === '<think>' && !reasoning) {
          reasoning = true;
          continue;
        } else if (chunk.type === 'text-delta' && chunk.textDelta === '</think>' && reasoning) {
          reasoning = false;
          continue;
        }

        // Deepseek R1 distilled on llama reasoning hack
        if (chunk.type === 'text-delta' && reasoning) {
          chunk = {
            type: 'reasoning',
            textDelta: chunk.textDelta
          };
        }

        chunks.push(chunk);
        yield chunk;
      }
    } catch (err) {
      logger.error(err);
      const errorChunk: MessageChunk = {
        type: 'error',
        message: err instanceof Error && err.name === 'AbortError' ? 'Aborted by user' : `${err}`
      };
      chunks.push(errorChunk);
      yield errorChunk;
    } finally {
      c.messages.push({ role: 'assistant', chunks, author: c.model });
      await ChatService.updateOne({ _id }, { messages: c.messages });
    }
  });
