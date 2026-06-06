/**
 * Promotes (or creates) a super_admin account for local testing.
 * Run: npm run promote-admin --workspace=@exam-prep/api
 */
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@examprep.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@123456';
const ADMIN_NAME = process.env.ADMIN_NAME ?? 'Super Admin';

async function main(): Promise<void> {
  await connectDatabase();

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const user = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL.toLowerCase() },
    {
      email: ADMIN_EMAIL.toLowerCase(),
      password: hashed,
      name: ADMIN_NAME,
      role: 'super_admin',
      isEmailVerified: true,
      isBanned: false,
      subscriptionPlan: 'premium',
    },
    { upsert: true, new: true }
  );

  console.log('\n✅ Admin account ready:\n');
  console.log(`   Email:    ${user.email}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Role:     ${user.role}`);
  console.log('\n   Login → http://localhost:3000/login');
  console.log('   Admin  → http://localhost:3000/admin\n');

  await disconnectDatabase();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
