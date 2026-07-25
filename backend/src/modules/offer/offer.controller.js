import OfferService from './offer.service.js';

class OfferController {
  async getWorkboard(req, res) {
    try {
      const { user_id, company_id } = req.user;
      const result = await OfferService.getWorkboard(company_id, user_id);
      res.json(result);
    } catch (error) {
      console.error('Error in getWorkboard:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async getOffersByJob(req, res) {
    try {
      const { job_id } = req.params;
      const { company_id } = req.user;
      const result = await OfferService.getOffersByJob(job_id, company_id);
      res.json(result);
    } catch (error) {
      console.error('Error in getOffersByJob:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async getOfferById(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id } = req.user;
      const result = await OfferService.getOfferById(offer_id, company_id);
      res.json(result);
    } catch (error) {
      console.error('Error in getOfferById:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async createOffer(req, res) {
    try {
      const { company_id, user_id } = req.user;
      const data = { ...req.body, company_id, created_by: user_id };
      const result = await OfferService.createOffer(data);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createOffer:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async updateCompensation(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const result = await OfferService.updateCompensation(offer_id, req.body, company_id, user_id);
      res.json(result);
    } catch (error) {
      console.error('Error in updateCompensation:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async sendOfferLetter(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const result = await OfferService.sendOfferLetter(offer_id, company_id, user_id);
      res.json(result);
    } catch (error) {
      console.error('Error in sendOfferLetter:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async acceptOffer(req, res) {
    try {
      const { offer_id } = req.params;
      const { acceptance_note } = req.body;
      const result = await OfferService.acceptOffer(offer_id, acceptance_note);
      res.json(result);
    } catch (error) {
      console.error('Error in acceptOffer:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async rejectOffer(req, res) {
    try {
      const { offer_id } = req.params;
      const { rejection_reason } = req.body;
      const result = await OfferService.rejectOffer(offer_id, rejection_reason);
      res.json(result);
    } catch (error) {
      console.error('Error in rejectOffer:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async negotiateOffer(req, res) {
    try {
      const { offer_id } = req.params;
      const { negotiation_message, requested_salary } = req.body;
      const result = await OfferService.negotiateOffer(offer_id, negotiation_message, requested_salary);
      res.json(result);
    } catch (error) {
      console.error('Error in negotiateOffer:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async respondToNegotiation(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const { response_type, response_message, revised_compensation } = req.body;
      const result = await OfferService.respondToNegotiation(
        offer_id, response_type, response_message, revised_compensation, company_id, user_id
      );
      res.json(result);
    } catch (error) {
      console.error('Error in respondToNegotiation:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async generateContract(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const { contract_type, start_date, end_date } = req.body;
      const result = await OfferService.generateContract(offer_id, contract_type, start_date, end_date, company_id, user_id);
      res.json(result);
    } catch (error) {
      console.error('Error in generateContract:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async sendContract(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const result = await OfferService.sendContract(offer_id, company_id, user_id);
      res.json(result);
    } catch (error) {
      console.error('Error in sendContract:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async signContract(req, res) {
    try {
      const { offer_id } = req.params;
      const { signature_data } = req.body;
      const result = await OfferService.signContract(offer_id, signature_data);
      res.json(result);
    } catch (error) {
      console.error('Error in signContract:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async bulkAdvanceToOnboarding(req, res) {
    try {
      const { job_id } = req.params;
      const { company_id, user_id } = req.user;
      const { candidate_ids } = req.body;
      const result = await OfferService.bulkAdvanceToOnboarding(job_id, candidate_ids, company_id, user_id);
      res.json(result);
    } catch (error) {
      console.error('Error in bulkAdvanceToOnboarding:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async getOfferStats(req, res) {
    try {
      const { job_id } = req.params;
      const { company_id } = req.user;
      const result = await OfferService.getOfferStats(job_id, company_id);
      res.json(result);
    } catch (error) {
      console.error('Error in getOfferStats:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async getSlipGaji(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id } = req.user;
      const result = await OfferService.getSlipGaji(offer_id, company_id);
      res.json(result);
    } catch (error) {
      console.error('Error in getSlipGaji:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async recordSlipGaji(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const { line_items, expected_salary } = req.body;
      const result = await OfferService.recordSlipGaji(offer_id, line_items, expected_salary, company_id, user_id);
      res.json(result);
    } catch (error) {
      console.error('Error in recordSlipGaji:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async skipSlipGaji(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const { reason } = req.body;
      const result = await OfferService.skipSlipGaji(offer_id, reason, company_id, user_id);
      res.json(result);
    } catch (error) {
      console.error('Error in skipSlipGaji:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async reviewSlipGaji(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const { note } = req.body;
      const result = await OfferService.reviewSlipGaji(offer_id, note, company_id, user_id);
      res.json(result);
    } catch (error) {
      console.error('Error in reviewSlipGaji:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async getApproval(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id } = req.user;
      const result = await OfferService.getApproval(offer_id, company_id);
      res.json(result);
    } catch (error) {
      console.error('Error in getApproval:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async submitApproval(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const { decision, note } = req.body;
      const result = await OfferService.submitApproval(offer_id, decision, note, company_id, user_id);
      res.json(result);
    } catch (error) {
      console.error('Error in submitApproval:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async setupApprovalChain(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const { steps } = req.body;
      const result = await OfferService.setupApprovalChain(offer_id, steps, company_id, user_id);
      res.json(result);
    } catch (error) {
      console.error('Error in setupApprovalChain:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async decideApprovalStep(req, res) {
    try {
      const { offer_id, step_index } = req.params;
      const { company_id, user_id } = req.user;
      const { decision, note } = req.body;
      const result = await OfferService.decideApprovalStep(offer_id, step_index, decision, note, company_id, user_id);
      res.json(result);
    } catch (error) {
      console.error('Error in decideApprovalStep:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async resendOffer(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const result = await OfferService.resendOffer(offer_id, company_id, user_id);
      res.json(result);
    } catch (error) {
      console.error('Error in resendOffer:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async revokeOffer(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const { reason } = req.body;
      const result = await OfferService.revokeOffer(offer_id, company_id, user_id, reason);
      res.json(result);
    } catch (error) {
      console.error('Error in revokeOffer:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async getSendHistory(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id } = req.user;
      const result = await OfferService.getSendHistory(offer_id, company_id);
      res.json(result);
    } catch (error) {
      console.error('Error in getSendHistory:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  // ---- Offer letter draft ----

  async getOfferLetterDraft(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id } = req.user;
      const result = await OfferService.getOfferLetterDraft(offer_id, company_id);
      res.json(result);
    } catch (error) {
      console.error('Error in getOfferLetterDraft:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async saveOfferLetterDraft(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id } = req.user;
      const { body } = req.body;
      const result = await OfferService.saveOfferLetterDraft(offer_id, body, company_id);
      res.json(result);
    } catch (error) {
      console.error('Error in saveOfferLetterDraft:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async downloadOfferLetterPdf(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id } = req.user;
      const buffer = await OfferService.downloadOfferLetterPdf(offer_id, company_id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="offer_letter_${offer_id}.pdf"`);
      res.send(buffer);
    } catch (error) {
      console.error('Error in downloadOfferLetterPdf:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async downloadOfferLetterDocx(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id } = req.user;
      const buffer = await OfferService.downloadOfferLetterDocx(offer_id, company_id);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="offer_letter_${offer_id}.docx"`);
      res.send(buffer);
    } catch (error) {
      console.error('Error in downloadOfferLetterDocx:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  /* Document upload / print — unused in review section

  async uploadDocument(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const result = await OfferService.uploadOfferDocument(offer_id, company_id, user_id, req.file);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async markOfferPrinted(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const result = await OfferService.markOfferPrinted(offer_id, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in markOfferPrinted:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  async getOfferDocument(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id } = req.user;
      const result = await OfferService.getOfferDocument(offer_id, company_id);
      res.json(result);
    } catch (error) {
      console.error('Error in getOfferDocument:', error);
      res.status(error.status || 500).json({ message: error.message });
    }
  }

  ---- end commented block ---- */
}

export default new OfferController();