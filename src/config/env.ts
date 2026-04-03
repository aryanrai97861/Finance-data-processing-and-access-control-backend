import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
} as const;

// Validate required environment variables
const requiredVars = ["DATABASE_URL", "JWT_SECRET"] as const;
for (const varName of requiredVars) {
  if (!env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}
