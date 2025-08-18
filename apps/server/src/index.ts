import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";

// Import routes
import addressRoutes from "./routes/address.routes"; // Corrected filename
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes"; // Import auth routes
import locationRoutes from "./routes/location.routes"; // Import location routes
import addressCategoriesRoutes from "./routes/address-categories.routes"; // Import address categories routes
import locationHistoryRoutes from "./routes/location-history.routes"; // Import location history routes
import notificationsRoutes from "./routes/notifications.routes"; // Import notifications routes
import addressSharingRoutes from "./routes/address-sharing.routes"; // Import address sharing routes
import qrCodeRoutes from "./routes/qr-code.routes"; // Import QR code routes
// import authRoutes from "./routes/authRoutes"; // Keep commented until created

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan("dev")); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded requests

// Serve static files (QR codes)
app.use(
  "/qr-codes",
  express.static(path.join(__dirname, "../public/qr-codes"))
);

// Routes
app.use("/api/addresses", addressRoutes); // Uncommented
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes); // Mount auth routes
app.use("/api/locations", locationRoutes); // Mount location routes
app.use("/api/address/categories", addressCategoriesRoutes); // Mount address categories routes
app.use("/api/location-history", locationHistoryRoutes); // Mount location history routes
app.use("/api/notifications", notificationsRoutes); // Mount notifications routes
app.use("/api/address-sharing", addressSharingRoutes); // Mount address sharing routes
app.use("/api/qr-code", qrCodeRoutes); // Mount QR code routes
// app.use("/api/auth", authRoutes); // Keep commented

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// 404 Handler for undefined routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    console.log("Server closed");
    process.exit(0);
  });
});

export default app;
