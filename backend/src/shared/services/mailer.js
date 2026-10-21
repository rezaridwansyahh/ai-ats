import nodemailer from "nodemailer"

// Google Workspace blocks password-based SMTP (App Passwords included) for
// this account — OAuth2/XOAUTH2 is the only supported auth path now. See
// scripts/gmail-oauth-setup.js for generating GMAIL_REFRESH_TOKEN.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    type: 'OAuth2',
    user: process.env.SMTP_EMAIL,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
  },
})

/**
 * Send an email
 * @param {string|string[]} to - recipient(s)
 * @param {string} subject
 * @param {string} html - HTML body
 */
export async function sendMail(to, subject, html) {
  const recipients = Array.isArray(to) ? to.join(", ") : to
  return transporter.sendMail({
    from: `"Myralix" <${process.env.SMTP_EMAIL}>`,
    to: recipients,
    subject,
    html,
  })
}

export default transporter
