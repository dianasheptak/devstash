import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Testing database connection...\n");

  // Item types
  const itemTypes = await prisma.itemType.findMany({ orderBy: { name: "asc" } });
  console.log(`Item types (${itemTypes.length}):`);
  for (const type of itemTypes) {
    console.log(`  - ${type.name} (${type.color})`);
  }

  // Demo user
  const user = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
  });
  if (!user) throw new Error("Demo user not found — run: npx prisma db seed");
  console.log(`\nDemo user: ${user.name} <${user.email}>`);
  console.log(`  isPro:         ${user.isPro}`);
  console.log(`  emailVerified: ${user.emailVerified?.toISOString()}`);

  // Collections + item counts
  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`\nCollections (${collections.length}):`);
  for (const col of collections) {
    console.log(`  - ${col.name} (${col.items.length} items)`);
  }

  // Items by type
  const items = await prisma.item.findMany({
    where: { userId: user.id },
    include: { itemType: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`\nItems (${items.length}):`);
  for (const item of items) {
    console.log(`  [${item.itemType.name}] ${item.title}`);
  }

  console.log("\nDatabase connection OK.");
}

main()
  .catch((e) => {
    console.error("Database connection failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
