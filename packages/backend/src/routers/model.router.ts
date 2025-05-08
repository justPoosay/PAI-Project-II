import { Router } from 'express';
import { stringify } from 'superjson';
import { getAvailableModels } from '../core/utils';

export const modelRouter = Router();

// trpc.model.available -> Model[]
modelRouter.get('/available', async (_, res) => void res.send(stringify(getAvailableModels())));
