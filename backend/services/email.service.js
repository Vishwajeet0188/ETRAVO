import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export default transporter;

export async function sendTestEmail(to) {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject: "RideApp Test Email",
            text: "Congratulations! Your email configuration is working successfully.",
        });

        console.log("Email sent:", info.messageId);
    } catch (err) {
        console.log("Email Error", err);
        throw err;
    }
}





export async function sendPasswordResetEmail(to, resetToken) {
    const resetLink = `http://localhost:8081/reset-password?token=${resetToken}`;

    const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: "RideApp Password Reset",
        html: `
            <h2>RideApp Password Reset</h2>

            <p>Hello,</p>

            <p>You requested to reset your password.</p>

            <p>
                Click the link below to reset your password:
            </p>

            <a href="${resetLink}">
                Reset Password
            </a>

            <p>This link expires in 15 minutes.</p>

            <p>If you didn't request this, ignore this email.</p>
        `,
    });

    console.log("Password reset email sent:", info.messageId);
}