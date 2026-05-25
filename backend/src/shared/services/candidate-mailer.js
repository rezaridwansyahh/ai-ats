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

export async function sendQuestionsEmail({ candidateName, candidateEmail, jobTitle, questions, link }) {
  if (!candidateEmail) {
    console.warn(`[candidate-mailer] Skipping no email for candidate ${candidateName}`);
    return;
  }

  const items = (Array.isArray(questions) ? questions : [])
    .map((q) => `<li><strong>${q.topic || ""}</strong> — ${q.text || ""}</li>`)
    .join("");

  const html = `
  <p>Hi ${candidateName},</p>
  <p>Thanks for applying for the <strong>${jobTitle}</strong> role. As a quick next step, please answer a few short follow-up questions:</p>
  <ol>${items}</ol>
  <p><a href="${link}">Answer the questions here</a></p>
  <p>Please respond within 48 hours. This link is personal to you — please don't share it.</p>
  `;

  await sendMail(candidateEmail, `Follow-up questions for ${jobTitle}`, html);
}
