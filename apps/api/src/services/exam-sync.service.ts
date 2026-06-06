import { EXAM_ECOSYSTEM } from '@exam-prep/shared';
import { ExamCategory } from '../models/ExamCategory';
import { Exam } from '../models/Exam';
import { getOfficialExamSlugs } from './exam-official.service';

/** Upsert all government exams from shared taxonomy into MongoDB */
export async function syncExamEcosystem(): Promise<{ categories: number; exams: number }> {
  let order = 0;
  for (const group of EXAM_ECOSYSTEM) {
    const category = await ExamCategory.findOneAndUpdate(
      { slug: group.slug },
      {
        name: group.name,
        slug: group.slug,
        group: group.slug,
        icon: group.icon,
        description: `${group.name} competitive exams`,
        order: order++,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    let examOrder = 0;
    for (const exam of group.exams) {
      await Exam.findOneAndUpdate(
        { slug: exam.slug },
        {
          name: exam.name,
          slug: exam.slug,
          categoryId: category._id,
          categorySlug: group.slug,
          order: examOrder++,
          isActive: true,
        },
        { upsert: true, new: true }
      );
    }
  }

  const officialSlugs = getOfficialExamSlugs();
  await Exam.updateMany(
    { slug: { $nin: [...officialSlugs] } },
    { $set: { isActive: false } }
  );

  const examCount = await Exam.countDocuments({ isActive: true });
  return { categories: EXAM_ECOSYSTEM.length, exams: examCount };
}
