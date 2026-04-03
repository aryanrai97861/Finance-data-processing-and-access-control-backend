import app from "./app";
import { env } from "./config/env";
import prisma from "./utils/prisma";

async function main() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Start server
    app.listen(env.PORT, () => {
      console.log(`\n🚀 Finance Dashboard API`);
      console.log(`   Environment : ${env.NODE_ENV}`);
      console.log(`   Port        : ${env.PORT}`);
      console.log(`   URL         : http://localhost:${env.PORT}`);
      console.log(`   Health      : http://localhost:${env.PORT}/api/health\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();
