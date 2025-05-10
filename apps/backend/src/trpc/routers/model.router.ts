import { getAvailableModels } from '../../core/utils';
import { publicProcedure, router } from '../trpc';

export const modelRouter = router({
  available: publicProcedure.query(getAvailableModels)
});
