import { config } from "dotenv";

config({ override: true, path: ".env" });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import transactionRoutes from "./modules/transaction/routes";
import messageRoutes from "./modules/messages/routes";
import reportsRoutes from "./modules/reports/routes";
import whatsappRoutes from "./modules/whatsapp/routes";
import userMiddleware from "./middleware/userMiddleware";
import userRoutes from "./modules/user/routes";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// Routes
app.use("/transactions", userMiddleware, transactionRoutes);
app.use("/messages", userMiddleware, messageRoutes);
app.use("/reports", userMiddleware, reportsRoutes);
app.use("/whatsapp", whatsappRoutes);
app.use("/users", userRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Banking AI Coach",
    whatsapp: "Connected", // Optional: add WhatsApp status
  });
});

// Serve transaction.html at /test/:id
app.get("/test/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "transaction.html"));
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Banking AI Coach API",
    version: "1.0.0",
  });
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
    });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Banking AI Coach server running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 WhatsApp webhook: http://localhost:${PORT}/whatsapp/webhook`);
});
