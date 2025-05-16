"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: "../../.env" }); // Adjust path to root .env if necessary
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
    process.exit(1);
}
const protect = (req, // Use the augmented Request type
res, next) => {
    let token;
    // Check for token in Authorization header (Bearer scheme)
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    // If no token found
    if (!token) {
        res.status(401).json({ error: "Unauthorized: No token provided" });
        return;
    }
    try {
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Attach user to the request object, ensuring required fields are present
        if (!decoded.id || !decoded.email) {
            res.status(401).json({ error: "Unauthorized: Invalid token payload" });
            return;
        }
        req.user = { id: decoded.id, email: decoded.email };
        next(); // Proceed to the next middleware/controller
    }
    catch (error) {
        console.error("Token verification failed:", error);
        // Handle specific JWT errors (e.g., TokenExpiredError, JsonWebTokenError)
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: "Unauthorized: Token expired" });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ error: "Unauthorized: Invalid token" });
            return;
        }
        // General unauthorized error for other issues
        res.status(401).json({ error: "Unauthorized: Token verification failed" });
        return;
    }
};
exports.protect = protect;
//# sourceMappingURL=auth.middleware.js.map