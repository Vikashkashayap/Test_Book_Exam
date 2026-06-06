import { redirect } from 'next/navigation';

/** Legacy AI Test Generator — replaced by Question Bank + Test Builder flow */
export default function AiTestGeneratorRedirect() {
  redirect('/admin/tests/create');
}
