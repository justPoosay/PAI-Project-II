import { streamText } from 'ai';
import { type } from 'arktype';
import { redis } from 'bun';
import { Effort, Model, models } from 'common';
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { stringify } from 'superjson';
import tools from '../core/tools';
import { getTextContent } from '../core/utils';
import { ChatService } from '../lib/db';
import { env } from '../lib/env';
import logger from '../lib/logger';
import { getLimits } from '../lib/stripe';

export const completionRouter = Router();

/**
 * trpc.completion
 * @author: averithefox
 */
completionRouter.post('/:id', async (req, res) => {
  if (!req.session?.user) {
    return void res.status(401).send();
  }

  const _id = type('string.hex==24').pipe(id => new ObjectId(id))(req.params.id);
  if (_id instanceof type.errors) {
    return void res.status(400).send(_id.summary);
  }

  const input = type.or({ message: 'string>0' }, { messageIndex: 'number' }).and({
    'preferences?': {
      name: 'string',
      occupation: 'string',
      selectedTraits: 'string',
      additionalInfo: 'string'
    },
    model: Model,
    reasoningEffort: Effort
  })(req.body);
  if (input instanceof type.errors) {
    return void res.status(400).send(input.summary);
  }

  try {
    const limits = await getLimits(req.session.user);
    const messagesPerMonth =
      limits.tier === 'pro' ? env.VITE_MESSAGES_PER_MONTH_PAID : env.VITE_MESSAGES_PER_MONTH_FREE;
    if (limits.messagesUsed >= messagesPerMonth) {
      return void res.status(429).send();
    } else {
      limits.messagesUsed += 1;
    }

    const c = await ChatService.findOne({
      _id,
      deleted: false,
      userId: new ObjectId(req.session.user.id)
    });
    if (!c) return void res.status(404).send();

    if ('message' in input) {
      c.messages.push({ role: 'user', content: input.message });
    } else {
      const message = c.messages.at(input.messageIndex);
      if (!message) return void res.status(400).send();
      if (message.role === 'user') {
        c.messages = c.messages.slice(0, input.messageIndex + 1);
      } else {
        c.messages = c.messages.slice(0, input.messageIndex);
      }
    }

    c.model = input.model;
    c.reasoningEffort = input.reasoningEffort;

    await ChatService.updateOne({ _id }, { messages: c.messages });

    if (!models[c.model]) {
      return void res.status(400).send();
    }

    let prompt = `You are an AI assistant powered by the ${models[c.model].name} model. You are here to help and engage in conversation. Feel free to mention that you're using the ${models[c.model].name} model if asked.`;
    prompt += ` If you are generating responses with math, you should use LaTeX, wrapped in $$.`;
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
      model: models[c.model].provider.it,
      messages: c.messages.map(m =>
        m.role === 'user' ? m : { role: 'assistant', content: getTextContent(m.chunks) }
      ),
      abortSignal: undefined,
      system: prompt,
      tools
    };

    if (c.model === 'claude-3-7-sonnet-thinking') {
      let budgetTokens = 1024;
      if (c.reasoningEffort === 'medium') budgetTokens = 2048;
      if (c.reasoningEffort === 'high') budgetTokens = 4096;
      options.providerOptions = {
        anthropic: {
          thinking: {
            type: 'enabled',
            budgetTokens
          }
        }
      };
    }
    if (c.model === 'o4-mini' || c.model === 'o3-mini') {
      options.providerOptions = {
        openai: {
          reasoningEffort: c.reasoningEffort || 'low'
        }
      };
    }
    if (c.model === 'gemini-2.5-flash-thinking') {
      let max_tokens = 1024;
      if (c.reasoningEffort === 'medium') max_tokens = 2048;
      if (c.reasoningEffort === 'high') max_tokens = 4096;
      options.providerOptions = {
        openrouter: {
          max_tokens
        }
      };
    }

    await redis.set(`user:limits:${req.session.user.id}`, stringify(limits));

    // Streaming response
    res.setHeader('Content-Type', 'application/jsonl');
    const stream = streamText(options);
    const chunks = [];
    let reasoning = false;
    try {
      for await (let chunk of stream.fullStream) {
        if (
          chunk.type !== 'tool-call' &&
          chunk.type !== 'text-delta' &&
          chunk.type !== 'reasoning'
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
        res.write(JSON.stringify(chunk) + '\n');
      }
      chunks.push(null);
      res.write('null\n');
      res.end();
    } catch (err) {
      const errorChunk = {
        type: 'error' as const,
        message: err instanceof Error && err.name === 'AbortError' ? 'Aborted by user' : `${err}`
      };
      chunks.push(errorChunk);
      res.write(JSON.stringify(errorChunk) + '\n');
      res.end();
    } finally {
      c.messages.push({ role: 'assistant', chunks, author: c.model });
      await ChatService.updateOne({ _id }, { messages: c.messages });
    }
  } catch (err) {
    logger.error(`[POST /completion/:id] ${err}`);
    res.status(500).send();
  }
});
