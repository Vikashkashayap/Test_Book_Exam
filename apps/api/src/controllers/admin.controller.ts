import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Test } from '../models/Test';
import { Question } from '../models/Question';
import { Result } from '../models/Result';
import { Payment } from '../models/Payment';
import { Attempt } from '../models/Attempt';
import { Exam } from '../models/Exam';
import { ExamCategory } from '../models/ExamCategory';
import { Subject } from '../models/Subject';
import { Topic } from '../models/Topic';
import { StudyMaterial } from '../models/StudyMaterial';
import { CurrentAffair } from '../models/CurrentAffair';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

function generateRandomPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function deleteStudentRelatedData(studentIds: Types.ObjectId[]) {
  const { Bookmark } = await import('../models/Bookmark');
  const { ChatMessage } = await import('../models/ChatMessage');
  const { Notification } = await import('../models/Notification');
  const { Subscription } = await import('../models/Subscription');
  const { Affiliate } = await import('../models/Affiliate');
  const { Referral } = await import('../models/Referral');
  const { Leaderboard } = await import('../models/Leaderboard');
  const { Feedback } = await import('../models/Feedback');

  return Promise.all([
    Attempt.deleteMany({ userId: { $in: studentIds } }),
    Result.deleteMany({ userId: { $in: studentIds } }),
    Payment.deleteMany({ userId: { $in: studentIds } }),
    Bookmark.deleteMany({ userId: { $in: studentIds } }),
    ChatMessage.deleteMany({ userId: { $in: studentIds } }),
    Notification.deleteMany({ userId: { $in: studentIds } }),
    Subscription.deleteMany({ userId: { $in: studentIds } }),
    Affiliate.deleteMany({ userId: { $in: studentIds } }),
    Referral.deleteMany({
      $or: [{ referrerId: { $in: studentIds } }, { referredUserId: { $in: studentIds } }],
    }),
    Leaderboard.updateMany({}, { $pull: { entries: { userId: { $in: studentIds } } } }),
    Feedback.deleteMany({ userId: { $in: studentIds } }),
  ]);
}

export const getAdminDashboard = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalStudents,
    activeUsers,
    testAttempts,
    revenueAgg,
    subscriptionBreakdown,
    recentPayments,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ lastActiveAt: { $gte: thirtyDaysAgo } }),
    Attempt.countDocuments({ status: { $in: ['submitted', 'auto_submitted'] } }),
    Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    User.aggregate([
      { $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } },
    ]),
    Payment.find({ status: 'paid' }).sort({ createdAt: -1 }).limit(10).populate('userId', 'name email').lean(),
  ]);

  res.json({
    success: true,
    data: {
      totalStudents,
      activeUsers,
      testAttempts,
      revenue: revenueAgg[0]?.total ?? 0,
      subscriptionBreakdown,
      recentPayments,
    },
  });
});

async function getOrCreateGeneralMeta(examCategoryId: string) {
  let subject = await Subject.findOne({ examCategoryId, slug: 'general' });
  if (!subject) {
    subject = await Subject.create({ name: 'General', slug: 'general', examCategoryId });
  }
  let topic = await Topic.findOne({ subjectId: subject._id, slug: 'general' });
  if (!topic) {
    topic = await Topic.create({ name: 'General', slug: 'general', subjectId: subject._id });
  }
  return { subject, topic };
}

export const listQuestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examId, page = 1, limit = 20, search } = req.query;
  const filter: Record<string, unknown> = { isActive: true };

  if (examId) {
    const exam = await Exam.findById(examId);
    if (exam) filter.examCategoryId = exam.categoryId;
  }
  if (search) filter.text = { $regex: search, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const [questions, total] = await Promise.all([
    Question.find(filter)
      .populate('subjectId', 'name')
      .populate('topicId', 'name')
      .populate('examCategoryId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Question.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: questions,
    meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  });
});

export const createQuestion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examId, text, options, correctAnswer, difficulty, type, explanation } = req.body;

  let examCategoryId = req.body.examCategoryId;
  let subjectId = req.body.subjectId;
  let topicId = req.body.topicId;

  if (examId) {
    const exam = await Exam.findById(examId);
    if (!exam) throw new ApiError(404, 'Exam not found');
    examCategoryId = exam.categoryId;
  }

  if (!examCategoryId) throw new ApiError(400, 'Select an exam');
  if (!text) throw new ApiError(400, 'Question text is required');

  if (!subjectId || !topicId) {
    const meta = await getOrCreateGeneralMeta(examCategoryId.toString());
    subjectId = meta.subject._id;
    topicId = meta.topic._id;
  }

  const question = await Question.create({
    type: type ?? 'single_mcq',
    text,
    options: options ?? [],
    correctAnswer: correctAnswer ?? 'A',
    difficulty: difficulty ?? 'medium',
    explanation,
    subjectId,
    topicId,
    examCategoryId,
    createdBy: req.user!.id,
  });

  res.status(201).json({ success: true, data: question });
});

export const bulkUploadQuestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { questions } = req.body;
  if (!Array.isArray(questions)) throw new ApiError(400, 'questions array required');

  const docs = questions.map((q: Record<string, unknown>) => ({
    ...q,
    createdBy: req.user!.id,
  }));
  const created = await Question.insertMany(docs);
  res.status(201).json({ success: true, data: { count: created.length } });
});

export const createTest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const test = await Test.create({ ...req.body, createdBy: req.user!.id });
  res.status(201).json({ success: true, data: test });
});

export const updateTest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!test) throw new ApiError(404, 'Test not found');
  res.json({ success: true, data: test });
});

export const cloneTest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const original = await Test.findById(req.params.id).lean();
  if (!original) throw new ApiError(404, 'Test not found');

  const { _id, slug, createdAt, updatedAt, attemptCount, publishedAt, ...rest } = original;
  const cloned = await Test.create({
    ...rest,
    title: `${rest.title} (Copy)`,
    slug: `${slug}-copy-${Date.now()}`,
    status: 'draft',
    clonedFrom: _id,
    createdBy: req.user!.id,
  });
  res.status(201).json({ success: true, data: cloned });
});

export const listStudents = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, search } = req.query;
  const filter: Record<string, unknown> = { role: 'student' };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [students, total] = await Promise.all([
    User.find(filter)
      .select('-password -refreshTokens')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: students,
    meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  });
});

export const getStudent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' })
    .select('-password -refreshTokens +adminVisiblePassword')
    .lean();
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, data: student });
});

export const resetStudentPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new ApiError(404, 'Student not found');

  const requested = typeof req.body.password === 'string' ? req.body.password.trim() : '';
  const newPassword = requested || generateRandomPassword();
  if (newPassword.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  student.password = await bcrypt.hash(newPassword, 12);
  student.adminVisiblePassword = newPassword;
  student.refreshTokens = [];
  await student.save();

  res.json({
    success: true,
    data: {
      studentId: student._id,
      password: newPassword,
      message: 'Password reset successfully',
    },
  });
});

export const deleteStudent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new ApiError(404, 'Student not found');

  const studentIds = [student._id];
  await deleteStudentRelatedData(studentIds);
  await User.deleteOne({ _id: student._id });

  res.json({
    success: true,
    data: {
      deleted: true,
      studentId: student._id,
      email: student.email,
      name: student.name,
    },
  });
});

export const purgeNonAdminUsers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const adminRoles = ['admin', 'super_admin'];
  const students = await User.find({ role: { $nin: adminRoles } }).select('_id email name role').lean();
  const studentIds = students.map((s) => s._id);

  if (!studentIds.length) {
    res.json({
      success: true,
      data: { removedUsers: 0, message: 'No student accounts to remove' },
    });
    return;
  }

  const [
    attempts,
    results,
    payments,
    bookmarks,
    chatMessages,
    notifications,
    subscriptions,
    affiliates,
    referrals,
    leaderboardUpdates,
  ] = await deleteStudentRelatedData(studentIds);
  const users = await User.deleteMany({ _id: { $in: studentIds } });

  res.json({
    success: true,
    data: {
      removedUsers: users.deletedCount ?? 0,
      removedStudents: students.map((s) => ({ email: s.email, name: s.name })),
      related: {
        attempts: attempts.deletedCount ?? 0,
        results: results.deletedCount ?? 0,
        payments: payments.deletedCount ?? 0,
        bookmarks: bookmarks.deletedCount ?? 0,
        chatMessages: chatMessages.deletedCount ?? 0,
        notifications: notifications.deletedCount ?? 0,
        subscriptions: subscriptions.deletedCount ?? 0,
        affiliates: affiliates.deletedCount ?? 0,
        referrals: referrals.deletedCount ?? 0,
        leaderboardsUpdated: leaderboardUpdates.modifiedCount ?? 0,
      },
    },
  });
});

export const banStudent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isBanned: true, banReason: reason },
    { new: true }
  );
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});

export const assignStudentExams = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examSlugs } = req.body;
  if (!Array.isArray(examSlugs) || examSlugs.length === 0) {
    throw new ApiError(400, 'Select at least one exam');
  }

  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') {
    throw new ApiError(404, 'Student not found');
  }

  const exams = await Exam.find({ slug: { $in: examSlugs }, isActive: true });
  if (!exams.length) {
    throw new ApiError(404, 'No valid exams found');
  }

  const updated = await User.findByIdAndUpdate(
    req.params.id,
    {
      selectedExams: exams.map((e) => e._id),
      selectedExamSlugs: exams.map((e) => e.slug),
      selectedCategorySlugs: [...new Set(exams.map((e) => e.categorySlug))],
      onboardingCompleted: true,
      onboardingStep: 3,
      'preferences.examCategories': [...new Set(exams.map((e) => e.categoryId))],
    },
    { new: true }
  ).select('-password -refreshTokens');

  res.json({
    success: true,
    data: {
      studentId: updated?._id,
      selectedExamSlugs: updated?.selectedExamSlugs ?? [],
    },
  });
});

export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await ExamCategory.create(req.body);
  res.status(201).json({ success: true, data: category });
});

export const createSubject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const subject = await Subject.create(req.body);
  res.status(201).json({ success: true, data: subject });
});

export const createTopic = asyncHandler(async (req: AuthRequest, res: Response) => {
  const topic = await Topic.create(req.body);
  res.status(201).json({ success: true, data: topic });
});

export const createStudyMaterial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const material = await StudyMaterial.create({ ...req.body, createdBy: req.user!.id });
  res.status(201).json({ success: true, data: material });
});

export const createCurrentAffair = asyncHandler(async (req: AuthRequest, res: Response) => {
  const affair = await CurrentAffair.create({ ...req.body, createdBy: req.user!.id });
  res.status(201).json({ success: true, data: affair });
});

export const getStudentTestHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const results = await Result.find({ userId: req.params.id })
    .populate('testId', 'title')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: results });
});
