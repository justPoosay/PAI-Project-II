import { Router} from 'express';
import { getAvailableModels } from '../core/utils';

export const modelRouter = Router();

/**
 * GET /available
 */

// export const modelRouter = router({
//   available: publicProcedure.query(getAvailableModels)
// });

 // Make sure to import your functions


/**
 * GET /available
 * Returns available models
 */

modelRouter.get("/available", async (req, res) => {
  try {
    const availableModels = await getAvailableModels();
    res.json(availableModels);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch available models" });
  }
});
