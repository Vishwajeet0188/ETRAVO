import jwt from "jsonwebtoken";
import { config } from "./config.js";

export function createToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

export function requireAuth(request, response, next) {
  const [scheme, token] = request.headers.authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({ message: "Authentication required" });
  }

  try {
    request.auth = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    return response.status(401).json({ message: "Invalid or expired token" });
  }
}
