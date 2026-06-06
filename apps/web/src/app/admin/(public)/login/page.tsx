import { redirect } from 'next/navigation';

/** Unified login — admins and students sign in at /login */
export default function AdminLoginRedirect() {
  redirect('/login');
}
