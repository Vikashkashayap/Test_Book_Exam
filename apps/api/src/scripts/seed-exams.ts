import { connectDatabase, disconnectDatabase } from '../config/database';
import { syncExamEcosystem } from '../services/exam-sync.service';

async function seedExams(): Promise<void> {
  await connectDatabase();
  const { categories, exams } = await syncExamEcosystem();
  console.log(`✅ Seeded ${exams} exams across ${categories} categories`);
  await disconnectDatabase();
}

seedExams().catch((err) => {
  console.error(err);
  process.exit(1);
});
