import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import { createToken } from "../src/auth.js";
import { loginSchema, registerSchema } from "../src/validation.js";

test("registration accepts both supported roles", () => {
  for (const role of ["driver", "passenger"]) {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: `${role}@example.com`,
      phone: role === "driver" ? "9000000001" : "9000000002",
      password: "password123",
      role,
    });

    assert.equal(result.success, true);
  }
});

test("registration rejects unsupported roles and short passwords", () => {
  const result = registerSchema.safeParse({
    name: "Test User",
    email: "user@example.com",
    phone: "9000000000",
    password: "short",
    role: "admin",
  });

  assert.equal(result.success, false);
});

test("login normalizes email and requires a valid role", () => {
  const result = loginSchema.parse({
    email: "  USER@Example.COM ",
    password: "password123",
    role: "passenger",
  });

  assert.equal(result.email, "user@example.com");
  assert.equal(result.role, "passenger");
});

test("token carries the user id and role", () => {
  const token = createToken({ id: "42", role: "driver" });
  const payload = jwt.verify(token, process.env.JWT_SECRET);

  assert.equal(payload.sub, "42");
  assert.equal(payload.role, "driver");
});
