import bcrypt from "bcrypt";
import { createToken } from "../src/auth.js";
import { pool } from "../src/db.js";
import { loginSchema, registerSchema } from "../src/validation.js";
import crypto from "crypto";
import {
    sendTestEmail,
    sendPasswordResetEmail
} from "../services/email.service.js";

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.created_at,
  };
}

export async function register(request, response, next) {
  const parsed = registerSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid registration details",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const { name, email, phone, password, role } = parsed.data;

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, role, created_at`,
      [name, email, phone, passwordHash, role]
    );

    const user = result.rows[0];

    return response.status(201).json({
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === "23505") {
      const field = error.constraint?.includes("phone")
        ? "phone"
        : "email";

      return response.status(409).json({
        message: `An account with this ${field} already exists`,
      });
    }

    next(error);
  }
}

export async function login(request, response, next) {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid login details",
    });
  }

  try {
    const { email, password, role } = parsed.data;

    const dbStart = Date.now();

    const result = await pool.query(
      `SELECT
          id,
          name,
          email,
          phone,
          role,
          password_hash,
          created_at
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    console.log(
      "DB query took:",
      Date.now() - dbStart,
      "ms"
    );

    const user = result.rows[0];

    if (!user || user.role !== role) {
      return response.status(401).json({
        message: "Incorrect email, password, or account role",
      });
    }

    const bcryptStart = Date.now();

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    console.log(
      "bcrypt compare took:",
      Date.now() - bcryptStart,
      "ms"
    );

    if (!passwordMatches) {
      return response.status(401).json({
        message: "Incorrect email, password, or account role",
      });
    }

    return response.json({
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(
  request,
  response,
  next
) {
  try {
    const result = await pool.query(
      `SELECT
          id,
          name,
          email,
          phone,
          role,
          created_at
       FROM users
       WHERE id = $1`,
      [request.auth.sub]
    );

    if (!result.rows[0]) {
      return response.status(404).json({
        message: "User not found",
      });
    }

    return response.json({
      user: publicUser(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
}

// Forgot password: 

export async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const result = await pool.query(
            `
            SELECT id, name, email
            FROM users
            WHERE email = $1
            LIMIT 1
            `,
            [email]
        );
        console.log(result.rows);
        const user = result.rows[0];
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If an account exists, a password reset link has been sent."
            });
        }
        const resetToken = crypto.randomBytes(32).toString("hex");  
        const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
          await pool.query(
            `
            DELETE FROM password_resets
            WHERE user_id = $1
            `,
            [user.id]
        );
        await pool.query(
          `
          INSERT INTO password_resets
          (
              user_id,
              token_hash,
              expires_at
          )
          VALUES
          (
              $1,
              $2,
              $3
          )
          `,
          [
              user.id,
              tokenHash,
              expiresAt
          ]
        );
        await sendPasswordResetEmail(user.email, resetToken);

        console.log("Reset Token:", resetToken);
        console.log("Hashed Token:", tokenHash);
        console.log("User Found:", user);
        console.log("Expires At:",expiresAt);

        return res.status(200).json({
            success: true,
            message: "If any account is registered with your email, you will receive forgot password link there."
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}


export async function resetPassword(req, res) {
    try {

        const { token, password } = req.body;
        const tokenHash = crypto .createHash("sha256").update(token).digest("hex");
        const result = await pool.query(
          `
          SELECT *
          FROM password_resets
          WHERE token_hash = $1
          LIMIT 1
          `,
          [tokenHash]
        );
        console.log(result.rows);
        const resetRequest = result.rows[0];
        if (!resetRequest) {
            return res.status(400).json({
                success: false,
                message: "Invalid reset token."
            });
        }
        if (new Date() > new Date(resetRequest.expires_at)) {
            return res.status(400).json({
                success: false,
                message: "Reset token has expired."
            });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        // Update password
        await pool.query(
            `
            UPDATE users
            SET password_hash = $1
            WHERE id = $2
            `,
            [
                passwordHash,
                resetRequest.user_id
            ]
        );

        // Delete the used reset token
        await pool.query(
            `
            DELETE FROM password_resets
            WHERE id = $1
            `,
            [resetRequest.id]
        );

        return res.status(200).json({
            success: true,
            message: "Password reset successfully."
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}