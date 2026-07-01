import { pool } from "../src/db.js";

export async function getPassengerHistory(req, res) {
  try {
    const passengerId = req.auth.sub;

    const result = await pool.query(
      `
      SELECT
          t.id,
          t.pickup_location,
          t.destination_location,
          t.pickup_time,
          t.fare,
          t.seats,
          t.status,
          t.completed_at,
          t.rating,
          u.name AS driver_name
      FROM trips t
      LEFT JOIN users u
      ON t.driver_id = u.id
      WHERE
          t.passenger_id = $1
          AND t.status = 'completed'
      ORDER BY t.completed_at DESC
      `,
      [passengerId]
    );

    res.status(200).json({
      success: true,
      trips: result.rows,
    });
  } catch (error) {
    console.error("History Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch history",
    });
  }
}