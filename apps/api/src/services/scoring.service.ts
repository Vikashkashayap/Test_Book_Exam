import { Types } from 'mongoose';
import { Question, IQuestion } from '../models/Question';
import { Test, ITest } from '../models/Test';
import { Attempt, IAnswerRecord } from '../models/Attempt';
import { Result } from '../models/Result';
import { Subject } from '../models/Subject';
import { Topic } from '../models/Topic';
import { generatePerformanceAnalysis } from './ai.service';
import { sendTestResultEmail } from './email.service';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { awardPoints } from './gamification.service';

function evaluateAnswer(
  question: IQuestion,
  answer: unknown,
  negativeMarkingEnabled = true
): { isCorrect: boolean; marks: number } {
  const correct = question.correctAnswer;

  if (answer === null || answer === undefined || answer === '') {
    return { isCorrect: false, marks: 0 };
  }

  const marksPerQuestion = question.marks ?? 1;
  const negativeMarks = negativeMarkingEnabled ? (question.negativeMarks ?? 0) : 0;

  switch (question.type) {
    case 'single_mcq':
    case 'assertion_reason': {
      const isCorrect = String(answer) === String(correct);
      return {
        isCorrect,
        marks: isCorrect ? marksPerQuestion : negativeMarks > 0 ? -negativeMarks : 0,
      };
    }
    case 'multiple_mcq': {
      const userAns = Array.isArray(answer) ? [...answer].sort() : [];
      const correctAns = Array.isArray(correct) ? [...correct].sort() : [];
      const isCorrect =
        userAns.length === correctAns.length &&
        userAns.every((a, i) => a === correctAns[i]);
      return {
        isCorrect,
        marks: isCorrect ? marksPerQuestion : negativeMarks > 0 ? -negativeMarks : 0,
      };
    }
    case 'numerical': {
      const tolerance = 0.01;
      const isCorrect = Math.abs(Number(answer) - Number(correct)) <= tolerance;
      return {
        isCorrect,
        marks: isCorrect ? marksPerQuestion : negativeMarks > 0 ? -negativeMarks : 0,
      };
    }
    default: {
      const isCorrect = String(answer) === String(correct);
      return {
        isCorrect,
        marks: isCorrect ? marksPerQuestion : negativeMarks > 0 ? -negativeMarks : 0,
      };
    }
  }
}

export async function calculateAndSaveResult(attemptId: string): Promise<typeof Result.prototype> {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) throw new Error('Attempt not found');

  const test = await Test.findById(attempt.testId).lean();
  if (!test) throw new Error('Test not found');

  const questions = await Question.find({ _id: { $in: test.questionIds } }).lean();
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;
  let totalTimeSeconds = 0;

  const subjectStats = new Map<
    string,
    { subjectId: Types.ObjectId; name: string; total: number; correct: number; wrong: number; unattempted: number; time: number }
  >();
  const topicStats = new Map<
    string,
    { topicId: Types.ObjectId; name: string; total: number; correct: number }
  >();

  const updatedAnswers: IAnswerRecord[] = [];

  for (const ans of attempt.answers) {
    const q = questionMap.get(ans.questionId.toString());
    if (!q) continue;

    totalTimeSeconds += ans.timeSpentSeconds ?? 0;

    const subKey = q.subjectId.toString();
    if (!subjectStats.has(subKey)) {
      const sub = await Subject.findById(q.subjectId).lean();
      subjectStats.set(subKey, {
        subjectId: q.subjectId,
        name: sub?.name ?? 'Unknown',
        total: 0,
        correct: 0,
        wrong: 0,
        unattempted: 0,
        time: 0,
      });
    }
    const subStat = subjectStats.get(subKey)!;
    subStat.total++;
    subStat.time += ans.timeSpentSeconds ?? 0;

    const topKey = q.topicId.toString();
    if (!topicStats.has(topKey)) {
      const top = await Topic.findById(q.topicId).lean();
      topicStats.set(topKey, {
        topicId: q.topicId,
        name: top?.name ?? 'Unknown',
        total: 0,
        correct: 0,
      });
    }
    const topStat = topicStats.get(topKey)!;
    topStat.total++;

    if (!ans.answer && ans.status === 'not_answered') {
      unattemptedCount++;
      subStat.unattempted++;
      updatedAnswers.push({ ...ans, isCorrect: false, marksObtained: 0 });
      continue;
    }

    const { isCorrect, marks } = evaluateAnswer(
      q as unknown as IQuestion,
      ans.answer,
      test.negativeMarking !== false
    );
    score += marks;

    if (isCorrect) {
      correctCount++;
      subStat.correct++;
      topStat.correct++;
    } else {
      wrongCount++;
      subStat.wrong++;
    }

    updatedAnswers.push({ ...ans, isCorrect, marksObtained: marks });
  }

  const maxScore = test.totalMarks;
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const accuracy =
    test.totalQuestions > 0 ? (correctCount / test.totalQuestions) * 100 : 0;

  const subjectAnalysis = Array.from(subjectStats.values()).map((s) => ({
    subjectId: s.subjectId,
    subjectName: s.name,
    total: s.total,
    correct: s.correct,
    wrong: s.wrong,
    unattempted: s.unattempted,
    accuracy: s.total > 0 ? (s.correct / s.total) * 100 : 0,
    timeSpentSeconds: s.time,
  }));

  const topicAnalysis = Array.from(topicStats.values()).map((t) => ({
    topicId: t.topicId,
    topicName: t.name,
    total: t.total,
    correct: t.correct,
    accuracy: t.total > 0 ? (t.correct / t.total) * 100 : 0,
  }));

  const existing = await Result.findOne({ attemptId: attempt._id });
  if (existing) return existing;

  const rankData = await Result.countDocuments({
    testId: test._id,
    score: { $gt: score },
  });
  const rank = rankData + 1;
  const totalParticipants = (await Result.countDocuments({ testId: test._id })) + 1;
  const percentile =
    totalParticipants > 1
      ? ((totalParticipants - rank) / totalParticipants) * 100
      : 100;

  const result = await Result.create({
    userId: attempt.userId,
    testId: test._id,
    attemptId: attempt._id,
    score,
    maxScore,
    percentage,
    rank,
    percentile,
    totalParticipants,
    correctCount,
    wrongCount,
    unattemptedCount,
    accuracy,
    totalTimeSeconds,
    subjectAnalysis,
    topicAnalysis,
  });

  attempt.answers = updatedAnswers;
  attempt.status = attempt.status === 'auto_submitted' ? 'auto_submitted' : 'submitted';
  attempt.submittedAt = new Date();
  await attempt.save();

  const aiInsight = await generatePerformanceAnalysis(result, test.title);
  result.aiAnalysis = {
    ...aiInsight,
    suggestedTests: aiInsight.suggestedTests.map((id) => new Types.ObjectId(id)),
    suggestedTopics: [],
    generatedAt: new Date(),
  };
  await result.save();

  await awardPoints(attempt.userId.toString(), Math.round(percentage / 10) * 10);

  const user = await User.findById(attempt.userId);
  if (user) {
    await sendTestResultEmail(user.email, user.name, test.title, score, percentage);
    await Notification.create({
      userId: user._id,
      type: 'result',
      title: 'Test Result Ready',
      message: `You scored ${percentage.toFixed(1)}% in ${test.title}`,
      link: `/results/${result._id}`,
    });
  }

  return result;
}
