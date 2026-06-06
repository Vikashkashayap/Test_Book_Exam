import { Response } from 'express';
import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import { ChatMessage } from '../models/ChatMessage';
import { Question } from '../models/Question';
import { chatWithMentor } from '../services/ai.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

export const mentorChat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { message, sessionId, questionId } = req.body;
  if (!message?.trim()) throw new ApiError(400, 'Message required');

  const session = sessionId ?? uuidv4();
  let context: { questionText?: string; subject?: string } | undefined;

  if (questionId) {
    const q = await Question.findById(questionId).populate('subjectId', 'name').lean();
    if (q) context = { questionText: q.text };
  }

  await ChatMessage.create({
    userId: req.user!.id,
    role: 'user',
    content: message,
    sessionId: session,
    context: questionId ? { questionId } : undefined,
  });

  const reply = await chatWithMentor(req.user!.id, message, context);

  await ChatMessage.create({
    userId: req.user!.id,
    role: 'assistant',
    content: reply,
    sessionId: session,
  });

  res.json({ success: true, data: { reply, sessionId: session } });
});

export const getChatHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.query;
  if (!sessionId || typeof sessionId !== 'string') {
    throw new ApiError(400, 'sessionId is required');
  }

  const messages = await ChatMessage.find({
    userId: req.user!.id,
    sessionId,
  })
    .sort({ createdAt: 1 })
    .limit(200)
    .select('role content sessionId createdAt')
    .lean();

  res.json({ success: true, data: messages });
});

export const listChatSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sessions = await ChatMessage.aggregate([
    { $match: { userId: new Types.ObjectId(req.user!.id) } },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: '$sessionId',
        messages: { $push: { role: '$role', content: '$content', createdAt: '$createdAt' } },
        updatedAt: { $max: '$createdAt' },
        messageCount: { $sum: 1 },
      },
    },
    { $sort: { updatedAt: -1 } },
    { $limit: 40 },
  ]);

  const data = sessions.map((s) => {
    const firstUser = s.messages.find((m: { role: string }) => m.role === 'user');
    const last = s.messages[s.messages.length - 1] as { content?: string } | undefined;
    return {
      sessionId: s._id as string,
      title: String(firstUser?.content ?? 'New chat').slice(0, 55),
      preview: String(last?.content ?? '').slice(0, 70),
      updatedAt: s.updatedAt,
      messageCount: s.messageCount as number,
    };
  });

  res.json({ success: true, data });
});
