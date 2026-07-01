import { pool } from "../src/db.js";

export const createTrip = async (req, res) => {
  try {
    const { pickup, dropoff, pickupTime, seats, fare } = req.body;

    const result = await pool.query(
      `
      INSERT INTO trips(
        passenger_id,
        pickup_location,
        destination_location,
        pickup_time,
        seats,
        status,
        fare
      )
      VALUES($1,$2,$3,$4,$5,'pending',$6)
      RETURNING *
      `,
      [
        req.auth.sub,
        pickup,
        dropoff,
        pickupTime,
        seats,
        fare
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to create trip",
    });
  }
};


export const getPassengerDashboard = async (req, res) => {
  try {
    const passengerId = req.auth.sub;

    const statsResult = await pool.query(
      `
      SELECT
        COUNT(*) AS total_trips,
        COALESCE(SUM(fare),0) AS total_spent,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_trips
      FROM trips
      WHERE passenger_id = $1
      `,
      [passengerId]
    );

    res.json({
      stats: {
        totalTrips: Number(statsResult.rows[0].total_trips),
        totalSpent: Number(statsResult.rows[0].total_spent),
        cancelledTrips: Number(statsResult.rows[0].cancelled_trips),
        rating: "0.0",
      },
      activities: [],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load passenger dashboard",
    });
  }
};