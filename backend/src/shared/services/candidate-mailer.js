import { sendMail } from "./mailer.js";

export async function sendScreeningEmail({candidateName, candidateEmail, jobTitle, stageName}){
  if(!candidateEmail){
    console.warn(`[candidate-mailer] Skipping no email for candidate ${candidateName}`);
    return 
  }

  const html = `
  <p>${candidateName}, </p>
  <p>You have been invited to the next stage of the hiring process for the position of ${jobTitle}</p>
  `
  await sendMail(candidateEmail, `Invitation to next stage: ${stageName}`, html);
}

export async function sendQuestionsEmail({
  candidateName,
  candidateEmail,
  jobTitle,
  link,
  customSubject = null,
  customBody = null,
}) {
  if (!candidateEmail) {
    console.warn(`[candidate-mailer] Skipping no email for candidate ${candidateName}`);
    return;
  }

  const subject = customSubject || `Follow-up Questions — ${jobTitle}`;

  let html;
  if (customBody) {
    // If the recruiter deleted {{LINK}}, append the link at the bottom so the
    // candidate always receives a working URL regardless of editing mistakes.
    const bodyWithFallback = customBody.includes('{{LINK}}')
      ? customBody
      : `${customBody}\n\n${link}`;
    const bodyWithLink = bodyWithFallback.replace(/\{\{LINK\}\}/g, `<a href="${link}" target="_blank">${link}</a>`);
    html = `<div style="font-family:Arial,sans-serif;color:#1a1a1f;line-height:1.6;white-space:pre-wrap;">${bodyWithLink}</div>`;
  } else {
    html = `
  <div style="font-family:Arial,sans-serif;color:#1a1a1f;line-height:1.6;">
    <p>Hi ${candidateName},</p>
    <p>Thank you for applying for the <strong>${jobTitle}</strong> position. As a next step,
       we have a few short follow-up questions for you.</p>
    <p>Please complete them via the link below:</p>
    <p>
      <a href="${link}" target="_blank">${link}</a>
    </p>
    <p style="color:#6B6660;font-size:13px;">Please respond within 48 hours. This link is
       personal — kindly do not share it with others.</p>
    <p>Thank you,<br/>The Recruitment Team</p>
  </div>
  `;
  }

  await sendMail(candidateEmail, subject, html);
}

export async function sendAssessmentInvitationEmail({
  candidateName,
  candidateEmail,
  jobTitle,
  link,
  battery,
  customSubject = null,
  customBody = null,
}) {
  if (!candidateEmail) {
    console.warn(`[candidate-mailer] Skipping no email for candidate ${candidateName}`);
    return;
  }

  const subject = customSubject || `Assessment Invitation — ${jobTitle}`;

  let html;
  if (customBody) {
    const bodyWithFallback = customBody.includes('{{LINK}}')
      ? customBody
      : `${customBody}\n\n${link}`;
    const bodyWithLink = bodyWithFallback.replace(/\{\{LINK\}\}/g, `<a href="${link}" target="_blank">${link}</a>`);
    html = `<div style="font-family:Arial,sans-serif;color:#1a1a1f;line-height:1.6;white-space:pre-wrap;">${bodyWithLink}</div>`;
  } else {
    html = `
  <div style="font-family:Arial,sans-serif;color:#1a1a1f;line-height:1.6;">
    <p>Hi ${candidateName},</p>
    <p>Thank you for your interest in the <strong>${jobTitle}</strong> position. As part of our selection process,
       we invite you to complete a psychometric assessment (Battery ${battery}).</p>
    <p>Please access the assessment portal via the link below:</p>
    <p>
      <a href="${link}" target="_blank">${link}</a>
    </p>
    <p style="color:#6B6660;font-size:13px;">This link is valid for 7 days and is personal — kindly do not share it with others.</p>
    <p>Thank you,<br/>The Recruitment Team</p>
  </div>
  `;
  }

  await sendMail(candidateEmail, subject, html);
}
