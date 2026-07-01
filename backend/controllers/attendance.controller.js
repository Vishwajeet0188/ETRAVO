import { pool } from "../src/db.js";

export async function getTodayAttendance (req, res){
  try {
    const userId = req.auth.sub;

    const result = await pool.query(
      `
      SELECT
        attendance_date,
        check_in,
        check_out,
        status
      FROM attendance
      WHERE user_id = $1
      AND attendance_date = CURRENT_DATE
      LIMIT 1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        status: "Absent",
        checkIn: null,
        checkOut: null,
      });
    }

    const attendance = result.rows[0];

    return res.json({
      status: attendance.status,
      checkIn: attendance.check_in,
      checkOut: attendance.check_out,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch attendance",
    });
  }
};



export async function markAttendance(req, res) {
  try {
    const userId = req.auth.sub;

    const existing = await pool.query(
      `
      SELECT id
      FROM attendance
      WHERE user_id = $1
      AND attendance_date = CURRENT_DATE
      `,
      [userId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Attendance already marked",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO attendance (
        user_id,
        attendance_date,
        check_in,
        status
      )
      VALUES (
        $1,
        CURRENT_DATE,
        CURRENT_TIME,
        'Present'
      )
      RETURNING *
      `,
      [userId]
    );

    const attendance = result.rows[0];

    return res.json({
      status: attendance.status,
      checkIn: attendance.check_in,
      checkOut: attendance.check_out,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to mark attendance",
    });
  }
}



export async function checkoutAttendance(req, res) {
  try {
    const userId = req.auth.sub;

    const result = await pool.query(
      `
      UPDATE attendance
      SET check_out = CURRENT_TIME
      WHERE user_id = $1
      AND attendance_date = CURRENT_DATE
      RETURNING *
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Attendance record not found",
      });
    }

    const attendance = result.rows[0];

    return res.json({
      status: attendance.status,
      checkIn: attendance.check_in,
      checkOut: attendance.check_out,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to checkout",
    });
  }
}



export async function getAttendanceHistory(req, res) {
  try {
    const userId = req.auth.sub;

    const result = await pool.query(
      `
      SELECT
        attendance_date,
        check_in,
        check_out,
        status
      FROM attendance
      WHERE user_id = $1
      ORDER BY attendance_date DESC
      `,
      [userId]
    );

    const records = result.rows.map(row => ({
      date: row.attendance_date,
      status: row.status,
      checkIn: row.check_in,
      checkOut: row.check_out,
    }));

    return res.json(records);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch history",
    });
  }
}




export async function getAttendanceSummary(req, res) {
  try {
    const userId = req.auth.sub;

    const result = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE status = 'Present') AS present_days,
        COUNT(*) FILTER (WHERE status = 'Absent') AS absent_days
      FROM attendance
      WHERE user_id = $1
      `,
      [userId]
    );

    const presentDays = Number(result.rows[0].present_days);
    const absentDays = Number(result.rows[0].absent_days);

    const totalDays = presentDays + absentDays;

    const attendancePercentage =
      totalDays === 0
        ? 0
        : Math.round((presentDays / totalDays) * 100);

    return res.json({
      presentDays,
      absentDays,
      attendancePercentage,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch summary",
    });
  }
}