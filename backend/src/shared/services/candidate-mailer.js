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
