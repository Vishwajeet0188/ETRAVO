
import { pool } from "../src/db.js";

export async function updateTripStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const driverId = req.auth.sub;

    let result;

    if (status === "accepted") {
      result = await pool.query(
        `
        UPDATE trips
        SET
          status = 'accepted',
          driver_id = $1
        WHERE id = $2
        RETURNING *
        `,
        [driverId, id]
      );
    } else if (status === "completed") {
      result = await pool.query(
        `
        UPDATE trips
        SET
          status = 'completed',
          completed_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [id]
      );
    } else if (status === "declined") {
      result = await pool.query(
        `
        UPDATE trips
        SET
          status = 'declined'
        WHERE id = $1
        RETURNING *
        `,
        [id]
      );
    } else {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    res.json({
      success: true,
      trip: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update trip",
    });
  }
}


export async function getMyTrips(req, res) {
  try {
    const driverId = req.auth.sub;
    const { status } = req.query;

    let query = `
      SELECT *
      FROM trips
      WHERE driver_id = $1
    `;

    let values = [driverId];

    if (status) {
      query += ` AND status = $2`;
      values.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(
      query,
      values
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


// export async function getPassengerHistory(req, res) {
//   try {
//     const passengerId = req.auth.sub;

//     const result = await pool.query(
//       `
//       SELECT
//         id,
//         pickup_location,
//         destination_location,
//         fare,
//         status,
//         completed_at,
//         driver_id,
//         rating
//       FROM trips
//       WHERE passenger_id = $1
//       AND status = 'completed'
//       ORDER BY completed_at DESC
//       `,
//       [passengerId]
//     );

//     res.json({
//       success: true,
//       trips: result.rows,
//     });

//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       message: "Failed to fetch passenger history",
//     });
//   }
// }


// import { pool } from "../src/db.js";

// export async function updateTripStatus(req, res) {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const driverId = req.auth.sub;

//     const result = await pool.query(
//       `
//       UPDATE trips
//       SET
//         status = $1,
//         driver_id = CASE
//           WHEN $1 = 'accepted' THEN $2
//           ELSE driver_id
//         END
//       WHERE id = $3
//       RETURNING *
//       `,
//       [status, driverId, id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({
//         message: "Trip not found",
//       });
//     }

//     res.json({
//       success: true,
//       trip: result.rows[0],
//     });
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       message: "Failed to update trip",
//     });
//   }
// }