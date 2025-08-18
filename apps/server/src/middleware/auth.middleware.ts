import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" }); // Adjust path to root .env if necessary

// Augment Express Request type to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error(
    "FATAL ERROR: JWT_SECRET is not defined in environment variables."
  );
  process.exit(1);
}

export const protect = (
  req: Request, // Use the augmented Request type
  res: Response,
  next: NextFunction
) => {
  let token;

  // Check for token in Authorization header (Bearer scheme)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // If no token found
  if (!token) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
    };

    // Attach user to the request object, ensuring required fields are present
    if (!decoded.id || !decoded.email) {
      res.status(401).json({ error: "Unauthorized: Invalid token payload" });
      return;
    }
    req.user = { id: decoded.id, email: decoded.email };

    next(); // Proceed to the next middleware/controller
  } catch (error) {
    console.error("Token verification failed:", error);
    // Handle specific JWT errors (e.g., TokenExpiredError, JsonWebTokenError)
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Unauthorized: Token expired" });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Unauthorized: Invalid token" });
      return;
    }
    // General unauthorized error for other issues
    res.status(401).json({ error: "Unauthorized: Token verification failed" });
    return;
  }
};
