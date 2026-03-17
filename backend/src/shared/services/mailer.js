import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
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
