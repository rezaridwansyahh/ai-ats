import OfferModel from './offer.model.js';
import CompensationEngine from '../../shared/services/compensation-engine.js';

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

    // Recalculate
    const compensation = CompensationEngine.calculate({
      base_salary,
      allowances,
      bonus_structure
    });

    // Update compensation
    await OfferModel.updateCompensation(offer_id, {
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
      compensation,
      message: 'Compensation updated successfully'
    };
  }

  // Send offer letter to candidate
  async sendOfferLetter(offer_id, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);

    if (!offer) {
      throw { status: 404, message: 'Offer not found' };
    }

    // Generate offer letter PDF (TODO: implement PDF generation)
    // const pdf_url = await generateOfferLetterPDF(offer);

    // Send email to candidate (TODO: implement email)
    // await sendOfferEmail(offer.candidate_email, pdf_url);

    // Update status
    await OfferModel.updateOfferStatus(offer_id, 'sent', {
      sent_at: new Date(),
      sent_by: user_id
    });

    return {
      message: 'Offer letter sent successfully',
      // pdf_url
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

}

export default new OfferService();
