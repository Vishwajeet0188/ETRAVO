import express from "express";
import  { sendTestEmail } from "../services/email.service.js";
const router = express.Router();

router.get("/test-email", async (req, res) => {
    try {
        await sendTestEmail("vishwajeetsingh52439@gmail.com");

        res.json({
            success: true,
            message: "Email Sent Successfully!",
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
export default router;