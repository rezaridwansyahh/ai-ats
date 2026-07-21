import OfferModel from './offer.model.js';
import CompensationEngine from '../../shared/services/compensation-engine.js';

function computeApprovalStatus(steps) {
  if (!steps || steps.length === 0) return 'not_started';
  if (steps.every((s) => s.status === 'approved')) return 'approved';
  const active = steps.find((s) => s.status !== 'approved');
  if (active?.status === 'rejected') return 'rejected';
  return 'in_progress';
}

class OfferService {
  // L1 Workboard - get all offers across jobs
  async getWorkboard(company_id, user_id) {
    const offers = await OfferModel.getWorkboard(company_id);

    // Group by status
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

    return {
      offers,
      stats
    };
  }

  // L3 Candidate - get single offer detail
  async getOfferById(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);

    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }

    // Get negotiation history if any
    const negotiations = await OfferModel.getNegotiationHistory(offer_id);

    return {
      ...offer,
      negotiations
    };
  }

  // Create new offer
  async createOffer(data) {
    const {
      company_id,
      candidate_id,
      job_id,
      position_title,
      contract_type, // 'PKWT' | 'PKWTT'
      base_salary,
      allowances, // JSONB: { transport, meal, health, etc }
      bonus_structure, // JSONB
      start_date,
      end_date, // for PKWT only
      created_by
    } = data;

    // Calculate compensation using engine
    const compensation = CompensationEngine.calculate({
      base_salary,
      allowances,
      bonus_structure
    });

    // Create offer record
    const offer_id = await OfferModel.createOffer({
      company_id,
      candidate_id,
      job_id,
      position_title,
      contract_type,
      offer_status: 'draft',
      created_by
    });

    // Create compensation record
    await OfferModel.createCompensation({
      offer_id,
      base_salary,
      allowances,
      bonus_structure,
      gross_salary: compensation.gross_salary,
      pph21: compensation.pph21,
      bpjs_kesehatan: compensation.bpjs_kesehatan,
      bpjs_ketenagakerjaan: compensation.bpjs_ketenagakerjaan,
      net_salary: compensation.net_salary,
      calculation_metadata: compensation.metadata
    });

    return {
      offer_id,
      compensation,
      message: 'Offer created successfully'
    };
  }

  // Update compensation
  async updateCompensation(offer_id, data, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
  
    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }
  
    if (offer.offer_status !== 'draft') {
      throw { status: 400, message: 'Cannot update compensation after offer is sent' };
    }
  
    const { base_salary, allowances, bonus_structure } = data;
  
    const calculated = CompensationEngine.calculate({
      base_salary,
      allowances,
      bonus_structure
    });
  
    const payload = {
      base_salary,
      allowances,
      bonus_structure,
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

  // Candidate accepts offer
  async acceptOffer(offer_id, acceptance_note) {
    const offer = await OfferModel.getOfferByIdPublic(offer_id);

    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }

    if (offer.offer_status !== 'sent' && offer.offer_status !== 'negotiating') {
      throw { status: 400, message: 'Offer cannot be accepted in current status' };
    }

    await OfferModel.updateOfferStatus(offer_id, 'accepted', {
      accepted_at: new Date(),
      acceptance_note
    });

    // TODO: Notify recruiter via email

    return {
      message: 'Offer accepted successfully'
    };
  }

  // Candidate rejects offer
  async rejectOffer(offer_id, rejection_reason) {
    const offer = await OfferModel.getOfferByIdPublic(offer_id);

    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }

    if (offer.offer_status !== 'sent' && offer.offer_status !== 'negotiating') {
      throw { status: 400, message: 'Offer cannot be rejected in current status' };
    }

    await OfferModel.updateOfferStatus(offer_id, 'rejected', {
      rejected_at: new Date(),
      rejection_reason
    });

    // TODO: Notify recruiter

    return {
      message: 'Offer rejected'
    };
  }

  // Candidate negotiates
  async negotiateOffer(offer_id, negotiation_message, requested_salary) {
    const offer = await OfferModel.getOfferByIdPublic(offer_id);

    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }

    if (offer.offer_status !== 'sent') {
      throw { status: 400, message: 'Can only negotiate offers in sent status' };
    }

    // Create negotiation record
    await OfferModel.createNegotiation({
      offer_id,
      initiated_by: 'candidate',
      message: negotiation_message,
      requested_salary,
      status: 'pending'
    });

    // Update offer status
    await OfferModel.updateOfferStatus(offer_id, 'negotiating', {
      last_negotiation_at: new Date()
    });

    // TODO: Notify recruiter

    return {
      message: 'Negotiation submitted'
    };
  }

  // Recruiter responds to negotiation
  async respondToNegotiation(offer_id, response_type, response_message, revised_compensation, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);

    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }

    if (offer.offer_status !== 'negotiating') {
      throw { status: 400, message: 'No active negotiation' };
    }

    // Create response record
    await OfferModel.createNegotiation({
      offer_id,
      initiated_by: 'recruiter',
      message: response_message,
      response_type, // 'accept' | 'counter' | 'decline'
      status: 'responded'
    });

    if (response_type === 'accept' && revised_compensation) {
      // Update compensation with negotiated terms
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

    return {
      message: 'Negotiation response sent'
    };
  }

  // Generate contract after offer accepted
  async generateContract(offer_id, contract_type, start_date, end_date, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);

    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }

    if (offer.offer_status !== 'accepted') {
      throw { status: 400, message: 'Can only generate contract for accepted offers' };
    }

    // Generate contract PDF (TODO: implement template rendering)
    // const contract_pdf = await generateContractPDF(offer, contract_type, start_date, end_date);

    // Create contract record
    const contract_id = await OfferModel.createContract({
      offer_id,
      contract_type,
      start_date,
      end_date,
      status: 'ready',
      // pdf_url: contract_pdf.url,
      generated_by: user_id
    });

    return {
      contract_id,
      // pdf_url: contract_pdf.url,
      message: 'Contract generated successfully'
    };
  }

  // Send contract for signature
  async sendContract(offer_id, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);

    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }

    if (offer.contract_status !== 'ready') {
      throw { status: 400, message: 'Contract not ready to send' };
    }

    // TODO: Send email with contract link

    await OfferModel.updateContractStatus(offer_id, 'sent', {
      sent_at: new Date(),
      sent_by: user_id
    });

    return {
      message: 'Contract sent successfully'
    };
  }

  // Candidate signs contract
  async signContract(offer_id, signature_data) {
    const offer = await OfferModel.getOfferByIdPublic(offer_id);

    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }

    if (offer.contract_status !== 'sent') {
      throw { status: 400, message: 'Contract cannot be signed in current status' };
    }

    await OfferModel.updateContractStatus(offer_id, 'signed', {
      signed_at: new Date(),
      signature_data
    });

    // TODO: Notify recruiter

    return {
      message: 'Contract signed successfully'
    };
  }

  // L4 Calibration - bulk advance to Onboarding
  async bulkAdvanceToOnboarding(job_id, candidate_ids, company_id, user_id) {
    // Verify all candidates have signed contracts
    const offers = await OfferModel.getSignedOffersByJob(job_id, candidate_ids, company_id);

    if (offers.length !== candidate_ids.length) {
      throw { status: 400, message: 'Not all candidates have signed contracts' };
    }

    // Create onboarding records (TODO: implement onboarding module integration)
    // const onboarding_ids = await OnboardingModel.bulkCreate(offers, user_id);

    return {
      advanced_count: offers.length,
      message: `${offers.length} candidates advanced to Onboarding`
    };
  }

  // Get offer statistics
  async getOfferStats(job_id, company_id) {
    return await OfferModel.getOfferStatsByJob(job_id, company_id);
  }

  async getSlipGaji(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }
    return offer.metadata?.intake?.slip_gaji || { status: 'not_recorded' };
  }

  // HR/HM manually types in whatever line items are on the candidate's payslip.
  async recordSlipGaji(offer_id, line_items, expected_salary, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }
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
      status: 'recorded',
      line_items,
      total,
      expected_salary: expected_salary != null ? Number(expected_salary) : null,
      recorded_at: new Date(),
      recorded_by: user_id,
    };
  
    const metadata = await OfferModel.mergeMetadata(offer_id, {
      intake: { ...(offer.metadata?.intake || {}), slip_gaji },
    });
    return { slip_gaji: metadata.intake.slip_gaji, message: 'Slip gaji recorded' };
  }
  
  // Recruiter skips this step entirely
  async skipSlipGaji(offer_id, reason, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }
  
    const slip_gaji = {
      status: 'skipped',
      skip_reason: reason || null,
      skipped_at: new Date(),
      skipped_by: user_id,
    };
  
    const metadata = await OfferModel.mergeMetadata(offer_id, {
      intake: { ...(offer.metadata?.intake || {}), slip_gaji },
    });
    return { slip_gaji: metadata.intake.slip_gaji, message: 'Slip gaji step skipped' };
  }
  
  // Recruiter's sanity-check note against what was recorded
  async reviewSlipGaji(offer_id, note, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }
  
    const current = offer.metadata?.intake?.slip_gaji;
    if (!current || current.status !== 'recorded') {
      throw { status: 400, message: 'No recorded slip gaji to review yet' };
    }
  
    const slip_gaji = {
      ...current,
      reviewed_at: new Date(),
      reviewed_by: user_id,
      review_note: note || null,
    };
  
    const metadata = await OfferModel.mergeMetadata(offer_id, {
      intake: { ...(offer.metadata?.intake || {}), slip_gaji },
    });
    return { slip_gaji: metadata.intake.slip_gaji, message: 'Review recorded' };
  }

  async getApproval(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }
    return offer.metadata?.approval || { status: 'not_started', steps: [] };
  }
  
  async submitApproval(offer_id, decision, note, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }
    if (!['approved', 'rejected'].includes(decision)) {
      throw { status: 400, message: "Decision must be 'approved' or 'rejected'" };
    }
    if (offer.offer_status !== 'draft') {
      throw { status: 400, message: 'Offer is no longer in draft — approval no longer applies' };
    }
    if (!offer.base_salary) {
      throw { status: 400, message: 'Finish Build (compensation) before requesting approval' };
    }
  
    const approval = {
      status: decision,
      decided_by: user_id,
      decided_at: new Date(),
      note: note || null,
    };
  
    const metadata = await OfferModel.mergeMetadata(offer_id, { approval });
    return { approval: metadata.approval, message: `Offer ${decision}` };
  }

 
  async sendOfferLetter(offer_id, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
  
    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }
  
    const approvalStatus = offer.metadata?.approval?.status;
    if (approvalStatus !== 'approved') {
      throw { status: 400, message: 'Offer must be approved before it can be sent' };
    }
    if (!offer.metadata?.draft_document) {
      throw { status: 400, message: 'Generate the draft document before sending' };
    }

    const expiryDays = offer.metadata?.dispatch?.portal_expiry_days || 7;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const send = await OfferModel.createOfferSend({
      offer_id,
      token_expires_at: expiresAt,
      document: offer.metadata.draft_document,
      sent_by: user_id,
    });

    await OfferModel.updateOfferStatus(offer_id, 'sent', {
      sent_at: new Date(),
      sent_by: user_id
    });
  
    return {
      message: 'Offer letter sent successfully',
      token_expires_at: send.token_expires_at,
    };
  }

  async resendOffer(offer_id, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);

    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }
    if (!['sent', 'negotiating'].includes(offer.offer_status)) {
      throw { status: 400, message: 'Can only resend offers that are sent or negotiating' };
    }

    await OfferModel.revokeActiveOfferSends(offer_id, user_id, 'Resent by recruiter');

    const expiryDays = offer.metadata?.dispatch?.portal_expiry_days || 7;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const send = await OfferModel.createOfferSend({
      offer_id,
      token_expires_at: expiresAt,
      document: offer.metadata?.draft_document || {},
      sent_by: user_id,
    });

    return {
      message: 'Offer resent successfully',
      token_expires_at: send.token_expires_at,
    };
  }

  async getSendHistory(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }
    return OfferModel.getOfferSendHistory(offer_id);
  }

  async setupApprovalChain(offer_id, steps, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }
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
      role: s.role.trim(),
      name: s.name.trim(),
      status: 'pending',
      note: null,
      decided_at: null,
      decided_by: null,
    }));
  
    const approval = { status: computeApprovalStatus(newSteps), steps: newSteps };
    const metadata = await OfferModel.mergeMetadata(offer_id, { approval });
    return { approval: metadata.approval, message: 'Approval chain set up' };
  }
  
  async decideApprovalStep(offer_id, step_index, decision, note, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }
    if (offer.offer_status !== 'draft') {
      throw { status: 400, message: 'Offer is no longer in draft — approval no longer applies' };
    }
    if (!['approved', 'rejected'].includes(decision)) {
      throw { status: 400, message: "Decision must be 'approved' or 'rejected'" };
    }
  
    const steps = offer.metadata?.approval?.steps;
    if (!steps || steps.length === 0) {
      throw { status: 400, message: 'No approval chain set up yet' };
    }
  
    const activeIndex = steps.findIndex((s) => s.status !== 'approved');
    if (activeIndex === -1) {
      throw { status: 400, message: 'All steps are already approved' };
    }
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

}

export default new OfferService();