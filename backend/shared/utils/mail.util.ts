import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test the connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ Mailer Connection Error:", error);
  } else {
    console.log("✅ Mailer is ready to send messages");
  }
});