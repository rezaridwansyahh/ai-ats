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

export async function sendQuestionsEmail({ candidateName, candidateEmail, jobTitle, link }) {
  if (!candidateEmail) {
    console.warn(`[candidate-mailer] Skipping no email for candidate ${candidateName}`);
    return;
  }

  const html = `
  <div style="font-family:Arial,sans-serif;color:#1a1a1f;line-height:1.6;">
    <p>Halo ${candidateName},</p>
    <p>Terima kasih telah melamar untuk posisi <strong>${jobTitle}</strong>. Sebagai langkah
       selanjutnya, kami memiliki beberapa pertanyaan singkat untuk Anda.</p>
    <p>Silakan kerjakan melalui tautan berikut:</p>
    <p>
      <a href="${link}" target="_blank">${link}</a>
    </p>
    <p style="color:#6B6660;font-size:13px;">Mohon diselesaikan dalam waktu 48 jam. Tautan ini bersifat
       pribadi — mohon untuk tidak membagikannya kepada orang lain.</p>
    <p>Terima kasih,<br/>Tim Rekrutmen</p>
  </div>
  `;

  await sendMail(candidateEmail, `Pertanyaan Lanjutan — ${jobTitle}`, html);
}
