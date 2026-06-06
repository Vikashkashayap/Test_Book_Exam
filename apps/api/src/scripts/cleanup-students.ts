/**
 * Removes all non-admin users and their related student data.
 * Keeps admin + super_admin accounts only.
 *
 * Run: npm run cleanup-students --workspace=@exam-prep/api
 */
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { Attempt } from '../models/Attempt';
import { Result } from '../models/Result';
import { Payment } from '../models/Payment';
import { Bookmark } from '../models/Bookmark';
import { ChatMessage } from '../models/ChatMessage';
import { Notification } from '../models/Notification';
import { Subscription } from '../models/Subscription';
import { Affiliate } from '../models/Affiliate';
import { Referral } from '../models/Referral';
import { Leaderboard } from '../models/Leaderboard';

const ADMIN_ROLES = ['admin', 'super_admin'];

async function main(): Promise<void> {
  await connectDatabase();

  const students = await User.find({ role: { $nin: ADMIN_ROLES } }).select('_id email name role').lean();
  const studentIds = students.map((s) => s._id);

  if (!studentIds.length) {
    console.log('\n✅ No student accounts to remove. Only admin users remain.\n');
    await disconnectDatabase();
    return;
  }

  console.log(`\nFound ${studentIds.length} non-admin account(s) to remove:\n`);
  for (const s of students) {
    console.log(`   - ${s.name} <${s.email}> (${s.role})`);
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
    users,
  ] = await Promise.all([
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
    Leaderboard.updateMany(
      {},
      { $pull: { entries: { userId: { $in: studentIds } } } }
    ),
    User.deleteMany({ _id: { $in: studentIds } }),
  ]);

  const remainingAdmins = await User.find({ role: { $in: ADMIN_ROLES } }).select('email name role').lean();

  console.log('\nCleanup summary:');
  console.log(`   Attempts removed:      ${attempts.deletedCount}`);
  console.log(`   Results removed:       ${results.deletedCount}`);
  console.log(`   Payments removed:      ${payments.deletedCount}`);
  console.log(`   Bookmarks removed:     ${bookmarks.deletedCount}`);
  console.log(`   Chat messages removed: ${chatMessages.deletedCount}`);
  console.log(`   Notifications removed: ${notifications.deletedCount}`);
  console.log(`   Subscriptions removed: ${subscriptions.deletedCount}`);
  console.log(`   Affiliates removed:    ${affiliates.deletedCount}`);
  console.log(`   Referrals removed:     ${referrals.deletedCount}`);
  console.log(`   Leaderboards updated:  ${leaderboardUpdates.modifiedCount}`);
  console.log(`   Users removed:         ${users.deletedCount}`);

  console.log('\n✅ Remaining admin account(s):\n');
  for (const admin of remainingAdmins) {
    console.log(`   - ${admin.name} <${admin.email}> (${admin.role})`);
  }
  console.log('\nNew student registrations will appear in Admin → Students.\n');

  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
