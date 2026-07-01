import { pool } from "../src/db.js";

export async function getDashboard(req, res, next) {
  try {
    const driverId = req.auth.sub;

    const statsResult = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_trips,
        COALESCE(SUM(fare) FILTER (WHERE status = 'completed'),0) AS total_earnings,
        COALESCE(AVG(rating) FILTER (WHERE rating IS NOT NULL),0) AS rating
      FROM trips
      WHERE driver_id = $1
      `,
      [driverId]
    );

    const todayResult = await pool.query(
      `
      SELECT
        COALESCE(SUM(fare),0) AS today_earnings
      FROM trips
      WHERE driver_id = $1
      AND status = 'completed'
      AND DATE(completed_at) = CURRENT_DATE
      `,
      [driverId]
    );

    const activitiesResult = await pool.query(
      `
      SELECT
        id,
        title,
        amount,
        created_at
      FROM activity_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [driverId]
    );

    res.json({
      stats: {
        totalEarnings: Number(
          statsResult.rows[0].total_earnings
        ),

        todayEarnings: Number(
          todayResult.rows[0].today_earnings
        ),

        completedTrips: Number(
          statsResult.rows[0].completed_trips
        ),

        rating: Number(
          statsResult.rows[0].rating
        ).toFixed(1),
      },

      activities: activitiesResult.rows,
    });
  } catch (error) {
    next(error);
  }
}




export async function getAvailableTrips(req, res) {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        pickup_location,
        destination_location,
        pickup_time,
        seats,
        fare,
        status,
        created_at
      FROM trips
      WHERE status = 'pending'
      AND driver_id IS NULL
      ORDER BY created_at DESC
      `
    );

    res.json({
      trips: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch trips",
    });
  }
}