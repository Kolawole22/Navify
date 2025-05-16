"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
// Import routes
const address_routes_1 = __importDefault(require("./routes/address.routes")); // Corrected filename
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes")); // Import auth routes
const location_routes_1 = __importDefault(require("./routes/location.routes")); // Import location routes
// import authRoutes from "./routes/authRoutes"; // Keep commented until created
// Load environment variables
dotenv_1.default.config();
// Create Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// Middleware
app.use((0, helmet_1.default)()); // Security headers
app.use((0, cors_1.default)()); // Enable CORS
app.use((0, morgan_1.default)("dev")); // Logging
app.use(express_1.default.json()); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true })); // Body parser for URL-encoded requests
// Routes
app.use("/api/addresses", address_routes_1.default); // Uncommented
app.use("/api/users", user_routes_1.default);
app.use("/api/auth", auth_routes_1.default); // Mount auth routes
app.use("/api/locations", location_routes_1.default); // Mount location routes
// app.use("/api/auth", authRoutes); // Keep commented
// Health check endpoint
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
// 404 Handler for undefined routes
app.use((_req, res) => {
    res.status(404).json({ error: "Not Found" });
});
// Global error handler
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({
        error: "Internal Server Error",
        message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});
// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    server.close(async () => {
        console.log("Server closed");
        process.exit(0);
    });
});
exports.default = app;
//# sourceMappingURL=index.js.map