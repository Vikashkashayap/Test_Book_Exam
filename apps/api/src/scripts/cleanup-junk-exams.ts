/**
 * Removes junk/test exams (abc, bankings, up ploce) from the database.
 *
 * Run: npm run cleanup-junk-exams --workspace=@exam-prep/api
 */
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Exam } from '../models/Exam';
import { User } from '../models/User';
import { JUNK_EXAM_SLUGS } from '../services/exam-official.service';

async function main(): Promise<void> {
  await connectDatabase();

  const junkExams = await Exam.find({
    $or: [
      { slug: { $in: [...JUNK_EXAM_SLUGS] } },
      { name: { $in: ['abc', 'bankings', 'up ploce'] } },
    ],
  }).lean();

  if (!junkExams.length) {
    console.log('\n✅ No junk exams found in database.\n');
    await disconnectDatabase();
    return;
  }

  console.log(`\nRemoving ${junkExams.length} junk exam(s):\n`);
  for (const exam of junkExams) {
    console.log(`   - ${exam.name} (${exam.slug})`);
  }

  const junkSlugs = junkExams.map((e) => e.slug);
  const junkIds = junkExams.map((e) => e._id);

  const [deleted, usersUpdated] = await Promise.all([
    Exam.deleteMany({ _id: { $in: junkIds } }),
    User.updateMany(
      {
        $or: [
          { selectedExamSlugs: { $in: junkSlugs } },
          { selectedExams: { $in: junkIds } },
        ],
      },
      {
        $pull: {
          selectedExamSlugs: { $in: junkSlugs },
          selectedExams: { $in: junkIds },
        },
      }
    ),
  ]);

  console.log(`\n✅ Deleted ${deleted.deletedCount} exam(s).`);
  console.log(`✅ Updated ${usersUpdated.modifiedCount} user(s) who had these exams selected.\n`);

  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
