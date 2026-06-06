import { redirect } from 'next/navigation';

/** Legacy AI Question Generator — replaced by /admin/ai-questions */
export default function AiQuestionGeneratorRedirect() {
  redirect('/admin/ai-questions');
}
