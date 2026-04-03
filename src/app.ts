import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler";

// Route imports
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/user.routes";
import recordRoutes from "./modules/records/record.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";

const app = express();

// ─── Global Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Finance Dashboard API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ─── API Routes ──────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${_req.method} ${_req.originalUrl}`,
  });
});

// ─── Global Error Handler ────────────────────────────────────────
app.use(errorHandler);

export default app;
