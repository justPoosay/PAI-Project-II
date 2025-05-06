import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { ChatService } from '../lib/db';
export const chatRouter = Router();



//get
chatRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    const chats = await ChatService.find({
      userId: new ObjectId(userId as string),
      deleted: false
    });

    const result = chats.map(c => ({
      _id: c._id,
      name: c.name,
      pinned: c.pinned,
      updatedAt: c.updatedAt
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '500: Failed loading chat history' });
  }
});

//get/:id
chatRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const chat = await ChatService.findOne({
      _id: new ObjectId(req.params.id),
      deleted: false
    });

    if (!chat) {
      return res.status(404).json({ error: '404: Chat not found' });
    }

    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '500: failed loading chat history' });
  }
});

//post
chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    const newChat = {
      name: null,
      messages: [],
      deleted: false,
      updatedAt: new Date(),
      userId: new ObjectId(userId)
    };

    const inserted = await ChatService.insertOne(newChat);
    res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '500: Failed creatimg new chat' });
  }
});

//patch/:id
chatRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const update = req.body;

    const updated = await ChatService.updateOne(
      { _id: new ObjectId(req.params.id), deleted: false },
      update
    );

    if (!updated) {
      return res.status(404).json({ error: '404: Chat not found' });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '500: failed updating chat' });
  }
});

//delete/:id
chatRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await ChatService.updateOne(
      { _id: new ObjectId(req.params.id) },
      { deleted: true }
    );

    if (!updated) {
      return res.status(404).json({ error: '404: chat not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '500: failed deleting chat' });
  } 
});