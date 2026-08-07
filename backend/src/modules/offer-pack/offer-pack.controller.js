import OfferPackService from './offer-pack.service.js';

class OfferPackController {

  async setupChain(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const { steps } = req.body;
      const result = await OfferPackService.setupChain(offer_id, steps, company_id, user_id);
      res.status(201).json({ message: 'Approval chain set up', chain: result });
    } catch (err) {
      console.error('OfferPackController.setupChain:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async reviseChain(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const { steps } = req.body;
      const result = await OfferPackService.reviseChain(offer_id, steps, company_id, user_id);
      res.json({ message: 'Approval chain revoked and updated', chain: result });
    } catch (err) {
      console.error('OfferPackController.reviseChain:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getChain(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id } = req.user;
      const result = await OfferPackService.getChain(offer_id, company_id);
      res.json({ message: 'Approval chain fetched', chain: result });
    } catch (err) {
      console.error('OfferPackController.getChain:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async finalizeChain(req, res) {
    try {
      const { offer_id } = req.params;
      const { company_id, user_id } = req.user;
      const result = await OfferPackService.finalizeChain(offer_id, company_id, user_id);
      res.json({ message: 'Approval chain finalized', chain: result });
    } catch (err) {
      console.error('OfferPackController.finalizeChain:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async decideStep(req, res) {
    try {
      const { offer_id, step_id } = req.params;
      const { company_id, user_id } = req.user;
      const { decision, note } = req.body;
      const result = await OfferPackService.decideStepDirect(offer_id, step_id, decision, note, company_id, user_id);
      res.json({ message: `Step ${decision}`, step: result });
    } catch (err) {
      console.error('OfferPackController.decideStep:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByJob(req, res) {
    try {
      const { job_id } = req.params;
      const { company_id } = req.user;
      const result = await OfferPackService.getByJob(job_id, company_id);
      res.json({ message: 'Approval chains fetched', chains: result });
    } catch (err) {
      console.error('OfferPackController.getByJob:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getChainByToken(req, res) {
    try {
      const { token } = req.params;
      const result = await OfferPackService.getChainByToken(token);
      res.json({ message: 'Approval chain fetched', approval: result });
    } catch (err) {
      console.error('OfferPackController.getChainByToken:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async decideStepByToken(req, res) {
    try {
      const { token, step_id } = req.params;
      const { decision, note } = req.body;
      const result = await OfferPackService.decideStepByToken(token, step_id, decision, note);
      res.json({ message: `Step ${decision}`, step: result });
    } catch (err) {
      console.error('OfferPackController.decideStepByToken:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async downloadLetterDocxByToken(req, res) {
    try {
      const { token } = req.params;
      const buffer = await OfferPackService.downloadLetterByToken(token, 'docx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename="offer_letter.docx"');
      res.send(buffer);
    } catch (err) {
      console.error('OfferPackController.downloadLetterDocxByToken:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async downloadLetterPdfByToken(req, res) {
    try {
      const { token } = req.params;
      const buffer = await OfferPackService.downloadLetterByToken(token, 'pdf');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="offer_letter.pdf"');
      res.send(buffer);
    } catch (err) {
      console.error('OfferPackController.downloadLetterPdfByToken:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new OfferPackController();