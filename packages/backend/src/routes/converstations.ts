import express, { type NextFunction, type Request, type Response } from 'express';

const app = express();

app.get('/', (request: Request, response: Response, next: NextFunction) => {
  response.send();
});
