import express from 'express';
import { routes } from 'common';
import { getAvailableModels } from '~/core/utils';

export const modelsApp = express.Router();

modelsApp.get('/', (req, res) => {
  res.json(routes['models'].assert(getAvailableModels()));
})


