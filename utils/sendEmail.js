import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail", // You can use Gmail or any SMTP
            auth: {
                user: process.env.EMAIL_USER, // your email
                pass: process.env.EMAIL_PASS, // your app password
            },
        });

        await transporter.sendMail({
            from: `"My Store" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });

        console.log("✅ Email sent to", to);
    } catch (err) {
        console.error("❌ Email error:", err);
    }
};
