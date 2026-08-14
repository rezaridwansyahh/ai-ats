import OfferModel from './offer.model.js';
import CompensationEngine from '../../shared/services/compensation-engine.js';
import OfferTemplateModel from '../offer-template/offer-template.model.js';
import { mergeOfferLetter, htmlToDocxBuffer, convertHtmlToPdf } from '../../shared/services/document-merge.js';
import { sendOfferEmail } from '../../shared/services/candidate-mailer.js';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

function computeApprovalStatus(steps) {
  if (!steps || steps.length === 0) return 'not_started';
  if (steps.every((s) => s.status === 'approved')) return 'approved';
  const active = steps.find((s) => s.status !== 'approved');
  if (active?.status === 'rejected') return 'rejected';
  return 'in_progress';
}

const SENDABLE_STATUSES = ['draft', 'sent', 'negotiating'];

class OfferService {
  // L1 Workboard - get all offers across jobs
  async getWorkboard(company_id, user_id) {
    const offers = await OfferModel.getWorkboard(company_id);

    const grouped = {
      draft: offers.filter(o => o.offer_status === 'draft'),
      sent: offers.filter(o => o.offer_status === 'sent'),
      negotiating: offers.filter(o => o.offer_status === 'negotiating'),
      accepted: offers.filter(o => o.offer_status === 'accepted'),
      rejected: offers.filter(o => o.offer_status === 'rejected'),
      contract_ready: offers.filter(o => o.contract_status === 'ready'),
      contract_sent: offers.filter(o => o.contract_status === 'sent'),
      signed: offers.filter(o => o.contract_status === 'signed'),
    };

    return {
      offers,
      grouped,
      summary: {
        total: offers.length,
        draft: grouped.draft.length,
        sent: grouped.sent.length,
        negotiating: grouped.negotiating.length,
        accepted: grouped.accepted.length,
        rejected: grouped.rejected.length,
        signed: grouped.signed.length,
      }
    };
  }

  // L2 Position - get offers for specific job
  async getOffersByJob(job_id, company_id) {
    const offers = await OfferModel.getOffersByJob(job_id, company_id);
    const stats = await OfferModel.getOfferStatsByJob(job_id, company_id);
    return { offers, stats };
  }

  // L3 Candidate - get single offer detail
  async getOfferById(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    const negotiations = await OfferModel.getNegotiationHistory(offer_id);
    return { ...offer, negotiations };
  }

  async createOffer(data) {
    const {
      company_id, candidate_id, job_id, position_title, contract_type,
      base_salary, allowances, bonus_structure, start_date, end_date, created_by
    } = data;

    const compensation = CompensationEngine.calculate({ base_salary, allowances, bonus_structure });

    const offer_id = await OfferModel.createOffer({
      company_id, candidate_id, job_id, position_title, contract_type,
      offer_status: 'draft', created_by
    });

    await OfferModel.createCompensation({
      offer_id, base_salary, allowances, bonus_structure,
      gross_salary: compensation.gross_salary,
      pph21: compensation.pph21,
      bpjs_kesehatan: compensation.bpjs_kesehatan,
      bpjs_ketenagakerjaan: compensation.bpjs_ketenagakerjaan,
      net_salary: compensation.net_salary,
      calculation_metadata: compensation.metadata
    });

    return { offer_id, compensation, message: 'Offer created successfully' };
  }

  // Update compensation
  async updateCompensation(offer_id, data, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (offer.offer_status !== 'draft') {
      throw { status: 400, message: 'Cannot update compensation after offer is sent' };
    }

    const { base_salary, allowances, bonus_structure } = data;
    const calculated = CompensationEngine.calculate({ base_salary, allowances, bonus_structure });

    const payload = {
      base_salary, allowances, bonus_structure,
      gross_salary: calculated.gross_salary,
      pph21: calculated.pph21,
      bpjs_kesehatan: calculated.bpjs_kesehatan,
      bpjs_ketenagakerjaan: calculated.bpjs_ketenagakerjaan,
      net_salary: calculated.net_salary,
      calculation_metadata: calculated.metadata
    };

    if (offer.compensation_id) {
      await OfferModel.updateCompensation(offer_id, payload);
    } else {
      await OfferModel.createCompensation({ offer_id, ...payload });
    }

    return {
      compensation: { base_salary, allowances, bonus_structure, ...calculated },
      message: 'Compensation updated successfully'
    };
  }

  async acceptOffer(offer_id, acceptance_note) {
    const offer = await OfferModel.getOfferByIdPublic(offer_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (!['sent', 'negotiating'].includes(offer.offer_status)) {
      throw { status: 400, message: 'Offer cannot be accepted in its current status' };
    }
    await OfferModel.updateOfferStatus(offer_id, 'accepted', {
      accepted_at: new Date(),
      acceptance_note: acceptance_note || null,
    });
    return { message: 'Offer accepted successfully' };
  }

  async rejectOffer(offer_id, rejection_reason) {
    const offer = await OfferModel.getOfferByIdPublic(offer_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (!['sent', 'negotiating'].includes(offer.offer_status)) {
      throw { status: 400, message: 'Offer cannot be rejected in its current status' };
    }
    await OfferModel.updateOfferStatus(offer_id, 'rejected', {
      rejected_at: new Date(),
      rejection_reason: rejection_reason || null,
    });
    return { message: 'Offer rejected' };
  }

  async negotiateOffer(offer_id, negotiation_message, requested_salary) {
    const offer = await OfferModel.getOfferByIdPublic(offer_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (!['sent', 'negotiating'].includes(offer.offer_status)) {
      throw { status: 400, message: 'Offer is not open for negotiation' };
    }
    if (!negotiation_message || !negotiation_message.trim()) {
      throw { status: 400, message: 'A negotiation message is required' };
    }

    await OfferModel.createNegotiation({
      offer_id,
      initiated_by: 'candidate',
      message: negotiation_message.trim(),
      requested_salary: requested_salary != null ? Number(requested_salary) : null,
      status: 'pending',
    });
    await OfferModel.updateOfferStatus(offer_id, 'negotiating');

    return { message: 'Negotiation request submitted' };
  }

  async respondToNegotiation(offer_id, response_type, response_message, revised_compensation, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (offer.offer_status !== 'negotiating') throw { status: 400, message: 'No active negotiation' };

    await OfferModel.createNegotiation({
      offer_id, initiated_by: 'recruiter', message: response_message,
      response_type, status: 'responded'
    });

    if (response_type === 'accept' && revised_compensation) {
      const compensation = CompensationEngine.calculate(revised_compensation);
      await OfferModel.updateCompensation(offer_id, {
        ...revised_compensation,
        gross_salary: compensation.gross_salary,
        pph21: compensation.pph21,
        bpjs_kesehatan: compensation.bpjs_kesehatan,
        bpjs_ketenagakerjaan: compensation.bpjs_ketenagakerjaan,
        net_salary: compensation.net_salary,
        calculation_metadata: compensation.metadata
      });
      await OfferModel.updateOfferStatus(offer_id, 'sent');
    } else if (response_type === 'decline') {
      await OfferModel.updateOfferStatus(offer_id, 'rejected', {
        rejection_reason: 'Negotiation declined by recruiter'
      });
    }

    // TODO: Notify candidate
    return { message: 'Negotiation response sent' };
  }

  // Generate contract after offer accepted
  async generateContract(offer_id, contract_type, start_date, end_date, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (offer.offer_status !== 'accepted') {
      throw { status: 400, message: 'Can only generate contract for accepted offers' };
    }

    // Generate contract PDF (TODO: implement template rendering)
    // const contract_pdf = await generateContractPDF(offer, contract_type, start_date, end_date);

    const contract_id = await OfferModel.createContract({
      offer_id, contract_type, start_date, end_date, status: 'ready',
      // pdf_url: contract_pdf.url,
      generated_by: user_id
    });

    return { contract_id, message: 'Contract generated successfully' };
  }

  // Send contract for signature
  async sendContract(offer_id, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (offer.contract_status !== 'ready') {
      throw { status: 400, message: 'Contract not ready to send' };
    }
    // TODO: Send email with contract link
    await OfferModel.updateContractStatus(offer_id, 'sent', { sent_at: new Date(), sent_by: user_id });
    return { message: 'Contract sent successfully' };
  }

  // Candidate signs contract
  async signContract(offer_id, signature_data) {
    const offer = await OfferModel.getOfferByIdPublic(offer_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (offer.contract_status !== 'sent') {
      throw { status: 400, message: 'Contract cannot be signed in current status' };
    }
    await OfferModel.updateContractStatus(offer_id, 'signed', { signed_at: new Date(), signature_data });
    // TODO: Notify recruiter
    return { message: 'Contract signed successfully' };
  }

  // L4 Calibration - bulk advance to Onboarding
  async bulkAdvanceToOnboarding(job_id, candidate_ids, company_id, user_id) {
    const offers = await OfferModel.getSignedOffersByJob(job_id, candidate_ids, company_id);
    if (offers.length !== candidate_ids.length) {
      throw { status: 400, message: 'Not all candidates have signed contracts' };
    }
    // TODO: implement onboarding module integration
    return { advanced_count: offers.length, message: `${offers.length} candidates advanced to Onboarding` };
  }

  // Get offer statistics
  async getOfferStats(job_id, company_id) {
    return await OfferModel.getOfferStatsByJob(job_id, company_id);
  }

  async getSlipGaji(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    return offer.metadata?.intake?.slip_gaji || { status: 'not_recorded' };
  }

  async recordSlipGaji(offer_id, line_items, expected_salary, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (!Array.isArray(line_items) || line_items.length === 0) {
      throw { status: 400, message: 'At least one line item is required' };
    }
    for (const item of line_items) {
      if (!item.label || typeof item.amount !== 'number' || item.amount < 0) {
        throw { status: 400, message: 'Each line item needs a label and a non-negative amount' };
      }
    }

    const total = line_items.reduce((sum, item) => sum + item.amount, 0);
    const slip_gaji = {
      status: 'recorded', line_items, total,
      expected_salary: expected_salary != null ? Number(expected_salary) : null,
      recorded_at: new Date(), recorded_by: user_id,
    };

    const metadata = await OfferModel.mergeMetadata(offer_id, {
      intake: { ...(offer.metadata?.intake || {}), slip_gaji },
    });
    return { slip_gaji: metadata.intake.slip_gaji, message: 'Slip gaji recorded' };
  }

  async skipSlipGaji(offer_id, reason, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    const slip_gaji = {
      status: 'skipped', skip_reason: reason || null,
      skipped_at: new Date(), skipped_by: user_id,
    };

    const metadata = await OfferModel.mergeMetadata(offer_id, {
      intake: { ...(offer.metadata?.intake || {}), slip_gaji },
    });
    return { slip_gaji: metadata.intake.slip_gaji, message: 'Slip gaji step skipped' };
  }

  async reviewSlipGaji(offer_id, note, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    const current = offer.metadata?.intake?.slip_gaji;
    if (!current || current.status !== 'recorded') {
      throw { status: 400, message: 'No recorded slip gaji to review yet' };
    }

    const slip_gaji = { ...current, reviewed_at: new Date(), reviewed_by: user_id, review_note: note || null };
    const metadata = await OfferModel.mergeMetadata(offer_id, {
      intake: { ...(offer.metadata?.intake || {}), slip_gaji },
    });
    return { slip_gaji: metadata.intake.slip_gaji, message: 'Review recorded' };
  }

  async getApproval(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    return offer.metadata?.approval || { status: 'not_started', steps: [] };
  }

  async submitApproval(offer_id, decision, note, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (!['approved', 'rejected'].includes(decision)) {
      throw { status: 400, message: "Decision must be 'approved' or 'rejected'" };
    }
    if (offer.offer_status !== 'draft') {
      throw { status: 400, message: 'Offer is no longer in draft — approval no longer applies' };
    }
    if (!offer.base_salary) {
      throw { status: 400, message: 'Finish Build (compensation) before requesting approval' };
    }

    // NOTE: writes { status: decision, ... } — this is the field
    // sendOffer() below reads as offer.metadata.approval.status.
    const approval = { status: decision, decided_by: user_id, decided_at: new Date(), note: note || null };
    const metadata = await OfferModel.mergeMetadata(offer_id, { approval });
    return { approval: metadata.approval, message: `Offer ${decision}` };
  }

  async setupApprovalChain(offer_id, steps, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (!offer.base_salary) {
      throw { status: 400, message: 'Finish Build (compensation) before setting up approval' };
    }
    if (!Array.isArray(steps) || steps.length === 0) {
      throw { status: 400, message: 'At least one approval step is required' };
    }
    for (const step of steps) {
      if (!step.role?.trim() || !step.name?.trim()) {
        throw { status: 400, message: 'Each step needs a role and a name' };
      }
    }

    const existing = offer.metadata?.approval?.steps || [];
    const anyDecided = existing.some((s) => s.status === 'approved' || s.status === 'rejected');
    if (anyDecided) {
      throw { status: 400, message: 'Cannot redefine the chain once a decision has been recorded' };
    }

    const newSteps = steps.map((s) => ({
      role: s.role.trim(), name: s.name.trim(), status: 'pending',
      note: null, decided_at: null, decided_by: null,
    }));

    const approval = { status: computeApprovalStatus(newSteps), steps: newSteps };
    const metadata = await OfferModel.mergeMetadata(offer_id, { approval });
    return { approval: metadata.approval, message: 'Approval chain set up' };
  }

  async decideApprovalStep(offer_id, step_index, decision, note, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (offer.offer_status !== 'draft') {
      throw { status: 400, message: 'Offer is no longer in draft — approval no longer applies' };
    }
    if (!['approved', 'rejected'].includes(decision)) {
      throw { status: 400, message: "Decision must be 'approved' or 'rejected'" };
    }

    const steps = offer.metadata?.approval?.steps;
    if (!steps || steps.length === 0) throw { status: 400, message: 'No approval chain set up yet' };

    const activeIndex = steps.findIndex((s) => s.status !== 'approved');
    if (activeIndex === -1) throw { status: 400, message: 'All steps are already approved' };
    if (Number(step_index) !== activeIndex) {
      throw { status: 400, message: `Step ${activeIndex} is the active step — decide that one first` };
    }

    const updatedSteps = steps.map((s, i) =>
      i === activeIndex
        ? { ...s, status: decision, note: note || null, decided_at: new Date(), decided_by: user_id }
        : s
    );

    const approval = { status: computeApprovalStatus(updatedSteps), steps: updatedSteps };
    const metadata = await OfferModel.mergeMetadata(offer_id, { approval });
    return { approval: metadata.approval, message: `Step ${decision}` };
  }
  
  async sendOffer(offer_id, company_id, user_id, emailOverride = {}) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    if (!SENDABLE_STATUSES.includes(offer.offer_status)) {
      throw { status: 400, message: `Offer cannot be sent while it is ${offer.offer_status}` };
    }

    const isFirstSend = offer.offer_status === 'draft';

    const document = await OfferModel.getOfferDocument(offer_id);
    if (!document) {
      throw { status: 400, message: 'Upload or generate the finalized offer letter before sending' };
    }
    if (!offer.candidate_email) {
      throw { status: 400, message: 'Candidate has no email on file — cannot send' };
    }

    await OfferModel.revokeActiveOfferSends(offer_id, user_id, 'Superseded by a new send');

    const expiryDays = offer.metadata?.dispatch?.portal_expiry_days || 7;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const send = await OfferModel.createOfferSend({
      offer_id,
      token_expires_at: expiresAt,
      sent_by: user_id,
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link = `${baseUrl}/offer/send/${send.token}`;

    await sendOfferEmail({
      candidateName: offer.candidate_name,
      candidateEmail: offer.candidate_email,
      jobTitle: offer.position_title || offer.job_title,
      link,
      customSubject: emailOverride.subject || null,
      customBody: emailOverride.body || null,
    });

    if (isFirstSend) {
      await OfferModel.updateOfferStatus(offer_id, 'sent', { sent_at: new Date(), sent_by: user_id });
    }

    return {
      message: isFirstSend ? 'Offer letter sent successfully' : 'Offer resent successfully',
      token: send.token,
      token_expires_at: send.token_expires_at,
    };
  }

  async revokeOffer(offer_id, company_id, user_id, reason) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    const history = await OfferModel.getOfferSendHistory(offer_id);
    const latest = history[0];
    if (latest?.status === 'signed') {
      throw { status: 409, message: 'Offer has been signed and cannot be revoked.' };
    }

    const revoked = await OfferModel.revokeActiveOfferSends(offer_id, user_id, reason || 'Revoked by recruiter');
    if (!revoked.length) throw { status: 400, message: 'No active send to revoke' };

    return { message: 'Offer link revoked' };
  }

  async getSendHistory(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    return OfferModel.getOfferSendHistory(offer_id);
  }

  async getOfferLetterFields(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    const template = await OfferTemplateModel.getByCompanyId(company_id);
    if (!template) return { has_template: false, fields: [], values: {} };

    const saved = offer.metadata?.offer_letter_data || {};
    const values = {};
    for (const field of template.fields || []) {
      values[field] = saved[field] || '';
    }

    return { has_template: true, fields: template.fields || [], values };
  }

  async saveOfferLetterData(offer_id, data, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    const template = await OfferTemplateModel.getByCompanyId(company_id);
    if (!template) {
      throw { status: 400, message: "Upload your company's offer letter template in Settings before filling this in" };
    }
    if (!data || typeof data !== 'object') {
      throw { status: 400, message: 'Field values are required' };
    }

    const allowedFields = new Set(template.fields || []);
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.has(key)) cleaned[key] = value;
    }

    const existing = offer.metadata?.offer_letter_data || {};
    const metadata = await OfferModel.mergeMetadata(offer_id, {
      offer_letter_data: { ...existing, ...cleaned },
    });

    return { offer_letter_data: metadata.offer_letter_data, message: 'Offer letter fields saved' };
  }

  async generateOfferLetterPreview(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    const template = await OfferTemplateModel.getByCompanyId(company_id);
    if (!template) throw { status: 400, message: "Upload your company's offer letter template in Settings first" };

    const saved = offer.metadata?.offer_letter_data || {};
    const fieldValues = {};
    for (const field of template.fields || []) {
      fieldValues[field] = saved[field]?.trim()
        ? saved[field]
        : `[${field.replace(/_/g, ' ')} — not filled in]`;
    }

    let docxBuffer;
    try {
      docxBuffer = await mergeOfferLetter({ templatePath: template.file, fieldValues });
    } catch (err) {
      throw { status: 400, message: 'Failed to merge template — check the uploaded file is a valid .docx' };
    }

    const { value: html } = await mammoth.convertToHtml({ buffer: docxBuffer });

    await OfferModel.mergeMetadata(offer_id, {
      offer_letter_final: { html, edited: false, generated_at: new Date() },
    });

    return { html, message: 'Offer letter generated from template' };
  }

  async getOfferLetterFinal(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    return offer.metadata?.offer_letter_final || null;
  }

  async downloadOfferLetterDocx(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    const final = offer.metadata?.offer_letter_final;
    if (final?.edited && final?.html) {
      return htmlToDocxBuffer(final.html);
    }

    const template = await OfferTemplateModel.getByCompanyId(company_id);
    if (!template) throw { status: 400, message: 'No template uploaded' };

    const saved = offer.metadata?.offer_letter_data || {};
    const fieldValues = {};
    for (const field of template.fields || []) {
      fieldValues[field] = saved[field]?.trim()
        ? saved[field]
        : `[${field.replace(/_/g, ' ')} — not filled in]`;
    }

    return mergeOfferLetter({ templatePath: template.file, fieldValues });
  }

  async downloadOfferLetterPdf(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    const final = offer.metadata?.offer_letter_final;
    if (!final?.html) {
      throw { status: 400, message: 'Generate the offer letter preview before downloading a PDF' };
    }

    return convertHtmlToPdf(final.html);
  }

  async saveOfferLetterFinal(offer_id, html, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (typeof html !== 'string' || !html.trim()) {
      throw { status: 400, message: 'Letter content is required' };
    }
    const metadata = await OfferModel.mergeMetadata(offer_id, {
      offer_letter_final: { html, edited: true, updated_at: new Date() },
    });
    return metadata.offer_letter_final;
  }

  async uploadOfferDocument(offer_id, company_id, user_id, file) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);

    if (!offer) {
      if (file?.path) fs.unlink(file.path, () => {});
      throw { status: 404, message: 'Offer not found' };
    }

    if (!file) {
      throw { status: 400, message: 'No file received' };
    }

    const existing = await OfferModel.getOfferDocument(offer_id);
    if (existing?.file && existing.file !== file.path) {
      fs.unlink(existing.file, (err) => {
        if (err) console.error('Failed to remove previous offer document:', err);
      });
    }

    const doc = await OfferModel.upsertOfferDocument({
      offer_id,
      file: file.path,
      method: 'upload',
      uploaded_by: user_id,
    });

    return { document: doc, message: 'Document uploaded' };
  }

  async getOfferDocument(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }
    return OfferModel.getOfferDocument(offer_id);
  }

  async downloadCandidateFile(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    const history = await OfferModel.getOfferSendHistory(offer_id);
    const latest = history[0];

    if (!latest?.candidate_file) {
      throw { status: 404, message: 'No candidate file has been submitted for this offer yet' };
    }

    return {
      filePath: latest.candidate_file,
      fileName: `signed_offer_${offer.candidate_name || 'candidate'}_${offer_id}${path.extname(latest.candidate_file)}`,
    };
  }

}

export default new OfferService();