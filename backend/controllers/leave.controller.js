import { pool } from "../src/db.js";

export async function applyLeave(req, res) {
  try {
    const userId = req.auth.sub;

    const {
      type,
      fromDate,
      toDate,
      reason,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO leaves (
        user_id,
        leave_type,
        from_date,
        to_date,
        reason,
        status
      )
      VALUES (
        $1, $2, $3, $4, $5, 'Pending'
      )
      RETURNING *
      `,
      [
        userId,
        type,
        fromDate,
        toDate,
        reason,
      ]
    );

    const leave = result.rows[0];

    return res.status(201).json({
      id: leave.id,
      type: leave.leave_type,
      fromDate: leave.from_date,
      toDate: leave.to_date,
      reason: leave.reason,
      status: leave.status,
      appliedOn: leave.created_at,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to apply leave",
    });
  }
}






export async function getLeaveHistory(req, res) {
  try {
    const userId = req.auth.sub;

    const result = await pool.query(
      `
      SELECT
        id,
        leave_type,
        from_date,
        to_date,
        reason,
        status,
        created_at
      FROM leaves
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    const records = result.rows.map(row => ({
      id: row.id,
      type: row.leave_type,
      fromDate: row.from_date,
      toDate: row.to_date,
      reason: row.reason,
      status: row.status,
      appliedOn: row.created_at,
    }));

    return res.json(records);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch leave history",
    });
  }
}




export async function getLeaveSummary(req, res) {
  try {
    const userId = req.auth.sub;

    const result = await pool.query(
      `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'Approved') AS approved,
        COUNT(*) FILTER (WHERE status = 'Pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'Rejected') AS rejected
      FROM leaves
      WHERE user_id = $1
      `,
      [userId]
    );

    const summary = result.rows[0];

    return res.json({
      total: Number(summary.total),
      approved: Number(summary.approved),
      pending: Number(summary.pending),
      rejected: Number(summary.rejected),
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch leave summary",
    });
  }
}



export async function cancelLeave(req, res) {
  try {
    const userId = req.auth.sub;
    const leaveId = req.params.id;

    const result = await pool.query(
      `
      UPDATE leaves
      SET status = 'Cancelled'
      WHERE id = $1
      AND user_id = $2
      AND status = 'Pending'
      RETURNING *
      `,
      [leaveId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Leave not found or already processed",
      });
    }

    return res.json({
      message: "Leave cancelled successfully",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to cancel leave",
    });
  }
}