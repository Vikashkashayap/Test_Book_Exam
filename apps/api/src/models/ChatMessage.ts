import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IChatMessage extends Document {
  userId: Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  context?: {
    questionId?: Types.ObjectId;
    testId?: Types.ObjectId;
    topicId?: Types.ObjectId;
  };
  sessionId: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    context: {
      questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
      testId: { type: Schema.Types.ObjectId, ref: 'Test' },
      topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
    },
    sessionId: { type: String, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
