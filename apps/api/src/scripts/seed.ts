import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { ExamCategory } from '../models/ExamCategory';
import { Subject } from '../models/Subject';
import { Topic } from '../models/Topic';
import { Achievement } from '../models/Achievement';
import bcrypt from 'bcryptjs';

async function seed(): Promise<void> {
  await connectDatabase();

  const category = await ExamCategory.findOneAndUpdate(
    { slug: 'ssc-cgl' },
    { name: 'SSC CGL', slug: 'ssc-cgl', description: 'Staff Selection Commission', order: 1 },
    { upsert: true, new: true }
  );

  const subject = await Subject.findOneAndUpdate(
    { slug: 'quantitative-aptitude', examCategoryId: category._id },
    { name: 'Quantitative Aptitude', slug: 'quantitative-aptitude', examCategoryId: category._id },
    { upsert: true, new: true }
  );

  await Topic.findOneAndUpdate(
    { slug: 'percentage', subjectId: subject._id },
    { name: 'Percentage', slug: 'percentage', subjectId: subject._id },
    { upsert: true, new: true }
  );

  const adminPass = await bcrypt.hash('Admin@123456', 12);
  await User.findOneAndUpdate(
    { email: 'admin@examprep.com' },
    {
      email: 'admin@examprep.com',
      password: adminPass,
      name: 'Super Admin',
      role: 'super_admin',
      isEmailVerified: true,
      subscriptionPlan: 'premium',
    },
    { upsert: true }
  );

  await Achievement.findOneAndUpdate(
    { code: 'first_test' },
    {
      code: 'first_test',
      name: 'First Step',
      description: 'Complete your first test',
      icon: '🎯',
      points: 50,
      criteria: { type: 'tests_completed', threshold: 1 },
    },
    { upsert: true }
  );

  console.log('Seed completed');
  await disconnectDatabase();
}

seed().catch(console.error);
