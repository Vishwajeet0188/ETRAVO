
import cors from "cors";
import express from "express";

import { config } from "./config.js";
import { pool } from "./db.js";

import authRoutes from "../routes/auth.routes.js";
import dashboardRoutes from "../routes/dashboard.routes.js";
import profileRoutes from "../routes/profile.routes.js";
import passengerRoutes from "../routes/passenger.routes.js";
import tripsRoutes from "../routes/trips.routes.js";
// const attendanceRoutes = require("../routes/attendance.routes.js");
import attendanceRoutes from "../routes/attendance.routes.js";
import leaveRoutes from "../routes/leave.routes.js";
import emailRoutes from "../routes/email.routes.js";
import historyRoutes from "../routes/history.routes.js";
const app = express();

app.use(cors());
app.use(express.json());

app.get("/check", async (_request, response, next) => {
  try {
    await pool.query("SELECT 1");
    response.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/passenger", passengerRoutes);
app.use("/api/trips", tripsRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/email",emailRoutes);
app.use("/api/passenger", historyRoutes);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({
    message: "Internal server error",
  });
});

app.listen(config.port, "0.0.0.0", () => {
  console.log(
    `RideApp API listening on http://localhost:${config.port}`
  );
});





// import bcrypt from "bcrypt";
// import cors from "cors";
// import express from "express";
// console.log(
//   "UV_THREADPOOL_SIZE =",
//   process.env.UV_THREADPOOL_SIZE
// );
// import { createToken, requireAuth } from "./auth.js";
// import { config } from "./config.js";
// import { pool } from "./db.js";
// import { loginSchema, registerSchema } from "./validation.js";

// const app = express();

// app.use(cors());
// app.use(express.json());

// function publicUser(user) {
//   return {
//     id: user.id,
//     name: user.name,
//     email: user.email,
//     phone: user.phone,
//     role: user.role,
//     createdAt: user.created_at,
//   };
// }

// app.get("/check", async (_request, response, next) => {
//   try {
//     await pool.query("SELECT 1");
//     response.json({ status: "ok", database: "connected" });
//   } catch (error) {
//     next(error);
//   }
// });

// app.post("/api/auth/register", async (request, response, next) => {
//   const parsed = registerSchema.safeParse(request.body);

//   if (!parsed.success) {
//     return response.status(400).json({
//       message: "Invalid registration details",
//       errors: parsed.error.flatten().fieldErrors,
//     });
//   }

//   try {
//     const { name, email, phone, password, role } = parsed.data;
//     const passwordHash = await bcrypt.hash(password, 10);
//     const result = await pool.query(
//       `INSERT INTO users (name, email, phone, password_hash, role)
//        VALUES ($1, $2, $3, $4, $5)
//        RETURNING id, name, email, phone, role, created_at`,
//       [name, email, phone, passwordHash, role],
//     );
//     const user = result.rows[0];

//     return response.status(201).json({
//       token: createToken(user),
//       user: publicUser(user),
//     });
//   } catch (error) {
//     if (error.code === "23505") {
//       const field = error.constraint?.includes("phone") ? "phone" : "email";
//       return response.status(409).json({
//         message: `An account with this ${field} already exists`,
//       });
//     }
//     next(error);
//   }
// });

// // app.post("/api/auth/login", async (request, response, next) => {
// //   const parsed = loginSchema.safeParse(request.body);

// //   if (!parsed.success) {
// //     return response.status(400).json({ message: "Invalid login details" });
// //   }

// //   try {
// //     const { email, password, role } = parsed.data;
// //     const result = await pool.query(
// //       `SELECT id, name, email, phone, role, password_hash, created_at
// //        FROM users
// //        WHERE email = $1 AND role = $2`,
// //       [email, role],
// //     );
// //     const user = result.rows[0];
// //     const passwordMatches =
// //       user && (await bcrypt.compare(password, user.password_hash));

// //     if (!passwordMatches) {
// //       return response.status(401).json({
// //         message: "Incorrect email, password, or account role",
// //       });
// //     }

// //     return response.json({
// //       token: createToken(user),
// //       user: publicUser(user),
// //     });
// //   } catch (error) {
// //     next(error);
// //   }
// // });

// app.post("/api/auth/login", async (request, response, next) => {
//   const parsed = loginSchema.safeParse(request.body);

//   if (!parsed.success) {
//     return response.status(400).json({
//       message: "Invalid login details",
//     });
//   }

//     try {
//       const { email, password, role } = parsed.data;

//       // Measure database query time
//       const dbStart = Date.now();

//       const result = await pool.query(
//         `SELECT
//             id,
//             name,
//             email,
//             phone,
//             role,
//             password_hash,
//             created_at
//         FROM users
//         WHERE email = $1
//         LIMIT 1`,
//         [email]
//       );

//       console.log(
//         "DB query took:",
//         Date.now() - dbStart,
//         "ms"
//       );

//       const user = result.rows[0];

//       // User not found or role mismatch
//       if (!user || user.role !== role) {
//         return response.status(401).json({
//           message: "Incorrect email, password, or account role",
//         });
//       }

//       // Measure bcrypt time
//       const bcryptStart = Date.now();

//       const passwordMatches = await bcrypt.compare(
//         password,
//         user.password_hash
//       );

//       console.log(
//         "bcrypt compare took:",
//         Date.now() - bcryptStart,
//         "ms"
//       );

//       if (!passwordMatches) {
//         return response.status(401).json({
//           message: "Incorrect email, password, or account role",
//         });
//       }

//       const token = createToken(user);

//       return response.json({
//         token,
//         user: publicUser(user),
//       });
//     } 
//       catch (error) {
//         next(error);
//       }
// });

// app.get("/api/auth/me", requireAuth, async (request, response, next) => {
//   try {
//     const result = await pool.query(
//       `SELECT id, name, email, phone, role, created_at
//        FROM users
//        WHERE id = $1`,
//       [request.auth.sub],
//     );

//     if (!result.rows[0]) {
//       return response.status(404).json({ message: "User not found" });
//     }

//     return response.json({ user: publicUser(result.rows[0]) });
//   } catch (error) {
//     next(error);
//   }
// });

// app.use((error, _request, response, _next) => {
//   console.error(error);
//   response.status(500).json({ message: "Internal server error" });
// });

// app.listen(config.port, "0.0.0.0", () => {
//   console.log(`RideApp API listening on http://localhost:${config.port}`);
// });
