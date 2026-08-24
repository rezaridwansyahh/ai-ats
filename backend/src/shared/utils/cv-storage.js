import fs from 'fs';
import path from 'path';

// Single source of truth for where candidate resume PDFs live on disk, and how
// they're named. Shared by every path that ends up with a resume attached to
// a master_applicant row: manual Talent Pool upload (sourcing.service.js),
// Seek RPA extraction (seek.service.js), LinkedIn RPA extraction
// (linkedin.service.js) — they all need to land in the same
// uploads/cv/{companyId}_{companyName}/{applicantId}_{applicantName}.pdf
// layout so the storage location doesn't depend on which source added the
// candidate.

export function safeSegment(value, fallback = 'unknown') {
  return (value || fallback).toString().replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

export function getCvUploadDir(companyId, companyName) {
  const companyFolder = `${companyId ?? 'unassigned'}_${safeSegment(companyName)}`;
  const dir = path.join(process.cwd(), 'uploads', 'cv', companyFolder);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function buildCvFilename(applicantId, applicantName) {
  return `${applicantId}_${safeSegment(applicantName, 'candidate')}.pdf`;
}

// Manual upload flow — buffer is already in memory (multer), write it directly.
export function saveCvBuffer(buffer, companyId, companyName, applicantId, applicantName) {
  const dir = getCvUploadDir(companyId, companyName);
  const savedPath = path.join(dir, buildCvFilename(applicantId, applicantName));
  fs.writeFileSync(savedPath, buffer);
  return savedPath;
}

// RPA download flow — Puppeteer already saved the PDF to a temp staging path
// (we don't know the applicant's real id until after DB insert). Promote it
// into permanent storage under the applicant's real id, then clean up the temp file.
export function promoteDownloadedCv(tempFilePath, companyId, companyName, applicantId, applicantName) {
  if (!tempFilePath || !fs.existsSync(tempFilePath)) return null;

  const dir = getCvUploadDir(companyId, companyName);
  const savedPath = path.join(dir, buildCvFilename(applicantId, applicantName));

  // copy+unlink rather than rename — temp dir (os.tmpdir()) and the uploads
  // dir can be on different drives/volumes, where fs.renameSync throws EXDEV.
  fs.copyFileSync(tempFilePath, savedPath);
  fs.unlinkSync(tempFilePath);

  return savedPath;
}
