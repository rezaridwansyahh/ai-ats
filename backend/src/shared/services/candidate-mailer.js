import { sendMail } from "./mailer.js";

export async function sendScreeningEmail({ candidateName, candidateEmail, jobTitle, stageName }) {
  if (!candidateEmail) {
    console.warn(`[candidate-mailer] Skipping no email for candidate ${candidateName}`);
    return;
  }

  const html = `
  <p>${candidateName}, </p>
  <p>You have been invited to the next stage of the hiring process for the position of ${jobTitle}</p>
  `;
  await sendMail(candidateEmail, `Invitation to next stage: ${stageName}`, html);
}

function interpolate(str, vars = {}) {
  let out = str;
  for (const [key, val] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key.toUpperCase()}}}`, val ?? '');
  }
  return out;
}

function renderBody(body, link, vars = {}) {
  let withLink = body;
  if (link) {
    withLink = body.includes('{{LINK}}') ? body : `${body}\n\n{{LINK}}`;
  }
  const interpolated = interpolate(withLink, vars);
  const html = link
    ? interpolated.replace(/\{\{LINK\}\}/g, `<a href="${link}" target="_blank">${link}</a>`)
    : interpolated;
  return `<div style="font-family:Arial,sans-serif;color:#1a1a1f;line-height:1.6;white-space:pre-wrap;">${html}</div>`;
}

export async function sendTemplatedEmail({ candidateName, candidateEmail, template, link, vars = {} }) {
  if (!candidateEmail) {
    console.warn(`[candidate-mailer] Skipping no email for candidate ${candidateName}`);
    return;
  }
  const subject = interpolate(template.subject, vars);
  const html = renderBody(template.body, link, vars);
  await sendMail(candidateEmail, subject, html);
}