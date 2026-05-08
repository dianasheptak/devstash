import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const DEMO_EMAIL = "demo@devstash.io";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const confirmed = process.argv.includes("--yes");

  const demo = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!demo) {
    throw new Error(`Demo user "${DEMO_EMAIL}" not found — refusing to run. Seed the database first.`);
  }

  const [
    totalUsers,
    targetUsers,
    targetItems,
    targetCollections,
    targetCustomItemTypes,
    targetAccounts,
    targetSessions,
    targetTokens,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { email: { not: DEMO_EMAIL } } }),
    prisma.item.count({ where: { user: { email: { not: DEMO_EMAIL } } } }),
    prisma.collection.count({ where: { user: { email: { not: DEMO_EMAIL } } } }),
    prisma.itemType.count({ where: { user: { email: { not: DEMO_EMAIL } } } }),
    prisma.account.count({ where: { user: { email: { not: DEMO_EMAIL } } } }),
    prisma.session.count({ where: { user: { email: { not: DEMO_EMAIL } } } }),
    prisma.verificationToken.count({ where: { identifier: { not: DEMO_EMAIL } } }),
  ]);

  console.log("Purge plan (demo user is preserved):");
  console.log(`  Database total users:        ${totalUsers}`);
  console.log(`  Users to delete:             ${targetUsers}`);
  console.log(`  Items to delete (cascade):   ${targetItems}`);
  console.log(`  Collections (cascade):       ${targetCollections}`);
  console.log(`  Custom item types (cascade): ${targetCustomItemTypes}`);
  console.log(`  Accounts (cascade):          ${targetAccounts}`);
  console.log(`  Sessions (cascade):          ${targetSessions}`);
  console.log(`  Verification tokens:         ${targetTokens}`);
  console.log("");

  if (targetUsers === 0 && targetTokens === 0) {
    console.log("Nothing to delete.");
    return;
  }

  if (!confirmed) {
    console.log('DRY RUN — re-run with "--yes" to actually delete.');
    return;
  }

  const deletedUsers = await prisma.user.deleteMany({
    where: { email: { not: DEMO_EMAIL } },
  });
  const deletedTokens = await prisma.verificationToken.deleteMany({
    where: { identifier: { not: DEMO_EMAIL } },
  });

  console.log(`Deleted ${deletedUsers.count} users (cascade removed their items, collections, accounts, sessions, custom item types).`);
  console.log(`Deleted ${deletedTokens.count} verification tokens.`);
}

main()
  .catch((err) => {
    console.error("Purge failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
