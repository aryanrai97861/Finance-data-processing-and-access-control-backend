import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clean existing data
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      email: "admin@finance.com",
      password: adminPassword,
      name: "Admin User",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log(`✅ Created admin: ${admin.email}`);

  // Create Analyst user
  const analystPassword = await bcrypt.hash("analyst123", 12);
  const analyst = await prisma.user.create({
    data: {
      email: "analyst@finance.com",
      password: analystPassword,
      name: "Analyst User",
      role: "ANALYST",
      status: "ACTIVE",
    },
  });
  console.log(`✅ Created analyst: ${analyst.email}`);

  // Create Viewer user
  const viewerPassword = await bcrypt.hash("viewer123", 12);
  const viewer = await prisma.user.create({
    data: {
      email: "viewer@finance.com",
      password: viewerPassword,
      name: "Viewer User",
      role: "VIEWER",
      status: "ACTIVE",
    },
  });
  console.log(`✅ Created viewer: ${viewer.email}`);

  // Create sample financial records
  const categories = {
    INCOME: ["Salary", "Freelance", "Investments", "Rental Income", "Bonus"],
    EXPENSE: ["Rent", "Utilities", "Groceries", "Transport", "Entertainment", "Healthcare", "Education", "Insurance"],
  };

  const records = [];

  // Generate 12 months of data
  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const date = new Date();
    date.setMonth(date.getMonth() - monthOffset);

    // Generate 3-5 income records per month
    const incomeCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < incomeCount; i++) {
      const category = categories.INCOME[Math.floor(Math.random() * categories.INCOME.length)];
      const day = 1 + Math.floor(Math.random() * 28);
      const recordDate = new Date(date.getFullYear(), date.getMonth(), day);

      records.push({
        amount: parseFloat((1000 + Math.random() * 9000).toFixed(2)),
        type: "INCOME" as const,
        category,
        description: `${category} payment for ${recordDate.toLocaleString("default", { month: "long" })}`,
        date: recordDate,
        userId: admin.id,
      });
    }

    // Generate 5-8 expense records per month
    const expenseCount = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < expenseCount; i++) {
      const category = categories.EXPENSE[Math.floor(Math.random() * categories.EXPENSE.length)];
      const day = 1 + Math.floor(Math.random() * 28);
      const recordDate = new Date(date.getFullYear(), date.getMonth(), day);

      records.push({
        amount: parseFloat((50 + Math.random() * 2000).toFixed(2)),
        type: "EXPENSE" as const,
        category,
        description: `${category} expense for ${recordDate.toLocaleString("default", { month: "long" })}`,
        date: recordDate,
        userId: admin.id,
      });
    }
  }

  await prisma.financialRecord.createMany({ data: records });
  console.log(`✅ Created ${records.length} financial records\n`);

  console.log("🎉 Seeding complete!");
  console.log("\n📋 Default credentials:");
  console.log("  Admin:   admin@finance.com   / admin123");
  console.log("  Analyst: analyst@finance.com / analyst123");
  console.log("  Viewer:  viewer@finance.com  / viewer123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
