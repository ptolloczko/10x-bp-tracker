/* eslint-disable no-console */
import { getSupabaseAdmin } from "./utils/supabase-admin";

/**
 * Global teardown script for Playwright E2E tests
 * Cleans up test data from Supabase database after all tests complete
 *
 * This script:
 * 1. Deletes all interpretation_logs
 * 2. Deletes all measurements
 * 3. Deletes all profiles
 * 4. Deletes all auth users
 *
 * Order matters due to foreign key constraints:
 * - interpretation_logs references measurements
 * - measurements and profiles reference auth.users
 *
 * NOTE: If E2E_USERNAME_ID is set, that user and their data will be preserved.
 */
async function globalTeardown() {
  console.log("\n🧹 Starting E2E test cleanup...\n");

  // Check if there's a protected user
  const protectedUserId = process.env.E2E_USERNAME_ID;
  if (protectedUserId) {
    console.log(`🔒 Protected user: ${protectedUserId} (will NOT be deleted)\n`);
  }

  try {
    const admin = getSupabaseAdmin();

    // Step 1: Delete interpretation logs (has FK to measurements)
    console.log("📋 Deleting interpretation logs...");
    let logsQuery = admin.from("interpretation_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Exclude protected user's data
    if (protectedUserId) {
      logsQuery = logsQuery.neq("user_id", protectedUserId);
    }

    const { error: logsError, count: logsCount } = await logsQuery;

    if (logsError) {
      console.error("❌ Error deleting interpretation logs:", logsError.message);
    } else {
      console.log(`✅ Deleted ${logsCount ?? 0} interpretation log(s)`);
    }

    // Step 2: Delete measurements (has FK to auth.users)
    console.log("📊 Deleting measurements...");
    let measurementsQuery = admin.from("measurements").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Exclude protected user's data
    if (protectedUserId) {
      measurementsQuery = measurementsQuery.neq("user_id", protectedUserId);
    }

    const { error: measurementsError, count: measurementsCount } = await measurementsQuery;

    if (measurementsError) {
      console.error("❌ Error deleting measurements:", measurementsError.message);
    } else {
      console.log(`✅ Deleted ${measurementsCount ?? 0} measurement(s)`);
    }

    // Step 3: Delete profiles (has FK to auth.users)
    console.log("👤 Deleting profiles...");
    let profilesQuery = admin.from("profiles").delete().neq("user_id", "00000000-0000-0000-0000-000000000000");

    // Exclude protected user's data
    if (protectedUserId) {
      profilesQuery = profilesQuery.neq("user_id", protectedUserId);
    }

    const { error: profilesError, count: profilesCount } = await profilesQuery;

    if (profilesError) {
      console.error("❌ Error deleting profiles:", profilesError.message);
    } else {
      console.log(`✅ Deleted ${profilesCount ?? 0} profile(s)`);
    }

    // Step 4: Delete auth users using admin API
    console.log("🔐 Deleting authentication users...");

    // Get all users
    const {
      data: { users },
      error: listUsersError,
    } = await admin.auth.admin.listUsers();

    if (listUsersError) {
      console.error("❌ Error listing users:", listUsersError.message);
    } else if (users && users.length > 0) {
      let deletedCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      // Delete each user (except protected one)
      for (const user of users) {
        // Skip protected user
        if (protectedUserId && user.id === protectedUserId) {
          console.log(`⏭️  Skipped protected user: ${user.email}`);
          skippedCount++;
          continue;
        }

        const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);

        if (deleteUserError) {
          console.error(`❌ Error deleting user ${user.email}:`, deleteUserError.message);
          errorCount++;
        } else {
          deletedCount++;
        }
      }

      console.log(`✅ Deleted ${deletedCount} auth user(s)`);
      if (skippedCount > 0) {
        console.log(`🔒 Protected ${skippedCount} user(s)`);
      }
      if (errorCount > 0) {
        console.log(`⚠️  Failed to delete ${errorCount} user(s)`);
      }
    } else {
      console.log("✅ No auth users to delete");
    }

    console.log("\n✨ E2E test cleanup completed!\n");
  } catch (error) {
    console.error("\n❌ Global teardown failed:", error);
    // Don't throw - we don't want to fail the test run if cleanup fails
    // The next test run will create new users anyway
  }
}

export default globalTeardown;
