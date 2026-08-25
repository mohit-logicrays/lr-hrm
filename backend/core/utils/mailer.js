import nodemailer from "nodemailer";

async function sendMail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

export async function sendWelcomeCredentialsMail({
  to,
  name,
  email,
  password,
  loginUrl,
}) {
  return sendMail({
    to,
    subject: "Your LR HRM account has been created",
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color: #111111;">Welcome to LR HRM, ${name}</h2>
        <p>An account has been created for you. Here are your login credentials:</p>
        <table style="background:#F7F7F8; border-radius:10px; padding:16px; width:100%;">
          <tr><td style="padding:6px 12px; color:#525252;">Email</td><td style="padding:6px 12px;"><strong>${email}</strong></td></tr>
          <tr><td style="padding:6px 12px; color:#525252;">Temporary password</td><td style="padding:6px 12px;"><strong>${password}</strong></td></tr>
        </table>
        <p style="margin-top:20px;">
          <a href="${loginUrl}" style="background:#C92F2F; color:#ffffff; padding:12px 24px; border-radius:10px; text-decoration:none; font-weight:600;">Login now</a>
        </p>
        <p style="color:#737373; font-size:13px; margin-top:24px;">
          Please change your password after logging in for the first time.
        </p>
      </div>
    `,
  });
}
