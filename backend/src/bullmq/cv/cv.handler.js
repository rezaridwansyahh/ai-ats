import fs from 'fs';
import SourcingModel from '../../modules/sourcing/sourcing.model.js';
import JobSourceModel from '../../modules/job-source/job-source.model.js';
import ApplicantModel from '../../modules/applicant/applicant.model.js';
import aiService from '../../shared/services/ai.service.js';

const zipProcessHandler = async ({ batchId, tempFilePath, companyId }) => {
  console.log(`[CV Worker] Processing ZIP batch ${batchId} from ${tempFilePath}`);

  // Dynamic import for CJS/ESM interop
  const admZipMod = await import('adm-zip');
  const AdmZip = admZipMod.default ?? admZipMod;

  let zipBuffer;
  try {
    zipBuffer = fs.readFileSync(tempFilePath);
  } catch (err) {
    await SourcingModel.updateBatch(batchId, {
      status: 'Failed',
      error_message: `Could not read temp file: ${err.message}`,
    });
    return;
  } finally {
    // Always clean up temp file
    try { fs.unlinkSync(tempFilePath); } catch { /* ignore */ }
  }

  let zip;
  try {
    zip = new AdmZip(zipBuffer);
  } catch {
    await SourcingModel.updateBatch(batchId, { status: 'Failed', error_message: 'Invalid or corrupted ZIP file.' });
    return;
  }

  const pdfEntries = zip.getEntries().filter((e) => {
    const name = e.entryName.toLowerCase();
    return !e.isDirectory && name.endsWith('.pdf') && !name.includes('__macosx');
  });

  if (pdfEntries.length === 0) {
    await SourcingModel.updateBatch(batchId, { status: 'Failed', error_message: 'ZIP contains no PDF files.' });
    return;
  }

  // Update total count now that we know it
  await SourcingModel.updateBatch(batchId, { total_files: pdfEntries.length });

  let processed = 0;
  let failed    = 0;

  for (const entry of pdfEntries) {
    const pdfBuffer = entry.getData();
    const pdfName   = entry.entryName.split('/').pop();

    try {
      // Send PDF buffer directly to OpenAI — no local text extraction needed
      const extracted = await aiService.extractCvForTalentPool(pdfBuffer, pdfName, { company_id: companyId });

      const candidateName = extracted.name ||
        pdfName.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').trim() ||
        'Unknown Candidate';

      const sourcing = await JobSourceModel.create(null, null, 'internal', extracted.last_position || 'Manual Upload', 'Active', null);

      await ApplicantModel.create({
        job_sourcing_id: sourcing.id,
        company_id:      companyId || null,
        name:            candidateName,
        email:           extracted.email,
        last_position:   extracted.last_position,
        address:         extracted.address,
        education:       extracted.education_summary,
        information:     extracted.facets,
        date:            new Date(),
        attachment:      null,
      });

      processed++;
      await SourcingModel.updateBatch(batchId, { processed_files: processed });
    } catch (err) {
      console.error(`[CV Worker] Failed to process ${pdfName}:`, err.message);
      failed++;
    }
  }

  const finalStatus = processed > 0 ? 'Done' : 'Failed';
  const summary     = `${processed}/${pdfEntries.length} CVs processed${failed > 0 ? `, ${failed} failed` : ''}`;

  await SourcingModel.updateBatch(batchId, {
    status:             finalStatus,
    processed_files:    processed,
    applicant_name:     processed > 0 ? `${processed} candidate${processed > 1 ? 's' : ''}` : null,
    applicant_position: summary,
    ...(finalStatus === 'Failed' ? { error_message: 'No CVs could be processed from the ZIP' } : {}),
  });

  console.log(`[CV Worker] ZIP batch ${batchId} done — ${summary}`);
};

const handlers = {
  'cv-zip-process': zipProcessHandler,
};

export default handlers;
