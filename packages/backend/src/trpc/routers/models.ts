import { getAvailableModels } from '../../core/utils';
import { publicProcedure } from '../trpc';

export const modelsRouter = publicProcedure.query(getAvailableModels);
