import { Router } from 'express';
import { stringify } from 'superjson';
import { getAvailableModels } from '../core/utils';

export const modelRouter = Router();

/**
 * trpc.model.available -> Model[]
 * @author: BajabongoTS
 */
modelRouter.get('/available', (_, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(stringify(getAvailableModels()));
});
