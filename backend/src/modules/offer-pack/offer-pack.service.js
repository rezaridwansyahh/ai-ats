import { randomUUID } from 'crypto';
import OfferPackModel from './offer-pack.model.js';
import OfferModel from '../offer/offer.model.js';
import OfferService from '../offer/offer.service.js';

const DECISIONS = ['approved', 'rejected'];

function computeRosterStatus(steps) {
  if (!steps || steps.length === 0) return 'not_started';
  if (steps.some((s) => s.status === 'rejected')) return 'rejected';
  if (steps.every((s) => s.status === 'approved')) return 'approved';
  return 'in_progress';
}

function computeOverallStatus(steps, chainMeta) {
  if (chainMeta?.finalized_at) return 'finalized';
  return computeRosterStatus(steps);
}

function resolveExpiry(offer) {
  const days = offer.metadata?.dispatch?.portal_expiry_days || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function validateSteps(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    throw { status: 400, message: 'At least one approval step is required' };
  }
  for (const s of steps) {
    if (!s.role?.trim() || !s.approver_name?.trim()) {
      throw { status: 400, message: 'Each step needs a role and an approver name' };
    }
  }
  return steps.map((s) => ({ role: s.role.trim(), approver_name: s.approver_name.trim() }));
}

class OfferPackService {

  async setupChain(offer_id, steps, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };
    if (!offer.base_salary) {
      throw { status: 400, message: 'Finish Build (compensation) before setting up the approval chain' };
    }
    if (offer.metadata?.approval_chain?.token) {
      throw { status: 400, message: 'An approval chain already exists for this offer — use revoke & edit instead' };
    }

    const cleaned = validateSteps(steps);
    const created = await OfferPackModel.setupRoster(offer_id, cleaned);

    const chainMeta = {
      token: randomUUID(),
      token_expires_at: resolveExpiry(offer),
      created_at: new Date(),
      created_by: user_id,
      finalized_at: null,
      finalized_by: null,
    };
    await OfferModel.mergeMetadata(offer_id, { approval_chain: chainMeta });

    return {
      status: computeOverallStatus(created, chainMeta),
      portal_link: `/offer/approve/${chainMeta.token}`,
      token_expires_at: chainMeta.token_expires_at,
      steps: created,
    };
  }

  async reviseChain(offer_id, steps, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    const chainMeta = offer.metadata?.approval_chain;
    if (!chainMeta?.token) {
      throw { status: 400, message: 'No approval chain exists yet — set one up first' };
    }
    if (chainMeta.finalized_at) {
      throw { status: 400, message: 'This chain has been finalized and can no longer be edited' };
    }

    const cleaned = validateSteps(steps);
    const revised = await OfferPackModel.setupRoster(offer_id, cleaned);

    const newChainMeta = {
      token: randomUUID(),
      token_expires_at: resolveExpiry(offer),
      created_at: chainMeta.created_at,
      created_by: chainMeta.created_by,
      revised_at: new Date(),
      revised_by: user_id,
      finalized_at: null,
      finalized_by: null,
    };
    await OfferModel.mergeMetadata(offer_id, { approval_chain: newChainMeta });

    return {
      status: computeOverallStatus(revised, newChainMeta),
      portal_link: `/offer/approve/${newChainMeta.token}`,
      token_expires_at: newChainMeta.token_expires_at,
      steps: revised,
    };
  }

  async getChain(offer_id, company_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    const chainMeta = offer.metadata?.approval_chain || null;
    const steps = await OfferPackModel.getByOfferId(offer_id);

    return {
      status: computeOverallStatus(steps, chainMeta),
      portal_link: chainMeta?.token ? `/offer/approve/${chainMeta.token}` : null,
      token_expires_at: chainMeta?.token_expires_at || null,
      finalized_at: chainMeta?.finalized_at || null,
      finalized_by: chainMeta?.finalized_by || null,
      steps,
    };
  }

  async finalizeChain(offer_id, company_id, user_id) {
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    const chainMeta = offer.metadata?.approval_chain;
    if (!chainMeta?.token) throw { status: 400, message: 'No approval chain set up yet' };
    if (chainMeta.finalized_at) throw { status: 400, message: 'This chain is already finalized' };

    const steps = await OfferPackModel.getByOfferId(offer_id);
    if (computeRosterStatus(steps) !== 'approved') {
      throw { status: 400, message: 'Every approver must approve before the chain can be finalized' };
    }

    const finalizedMeta = { ...chainMeta, finalized_at: new Date(), finalized_by: user_id };
    await OfferModel.mergeMetadata(offer_id, { approval_chain: finalizedMeta });

    return { status: 'finalized', finalized_at: finalizedMeta.finalized_at, steps };
  }

  async decideStepDirect(offer_id, step_id, decision, note, company_id, user_id) {
    if (!DECISIONS.includes(decision)) {
      throw { status: 400, message: "Decision must be 'approved' or 'rejected'" };
    }
    const offer = await OfferModel.getOfferById(offer_id, company_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    const chainMeta = offer.metadata?.approval_chain;
    if (chainMeta?.finalized_at) throw { status: 410, message: 'This approval chain has been finalized' };

    const steps = await OfferPackModel.getByOfferId(offer_id);
    if (computeRosterStatus(steps) === 'rejected') {
      throw { status: 410, message: 'This chain was not approved — revoke & edit it to restart' };
    }

    const target = steps.find((s) => s.id === Number(step_id));
    if (!target) throw { status: 404, message: 'Step not found' };

    const updated = await OfferPackModel.decideStep({
      step_id: target.id, status: decision, note, decided_by: user_id,
    });
    if (!updated) throw { status: 409, message: 'Failed to record decision' };
    return updated;
  }

  async getByJob(job_id, company_id) {
    const rows = await OfferPackModel.getByJob(job_id);
    const byOffer = new Map();
    for (const row of rows) {
      if (!byOffer.has(row.offer_id)) byOffer.set(row.offer_id, []);
      byOffer.get(row.offer_id).push(row);
    }
    return Array.from(byOffer.entries()).map(([offer_id, steps]) => ({
      offer_id,
      candidate_name: steps[0]?.candidate_name,
      status: computeOverallStatus(steps, steps[0]?.approval_chain),
      steps,
    }));
  }

  async getChainByToken(token) {
    const row = await OfferPackModel.getChainByToken(token);
    if (!row) throw { status: 404, message: 'Approval link not found' };

    const chainMeta = row.approval_chain;
    if (chainMeta?.finalized_at) {
      throw { status: 410, message: 'This approval chain has already been finalized' };
    }
    if (chainMeta?.token_expires_at && new Date(chainMeta.token_expires_at) < new Date()) {
      throw { status: 410, message: 'This approval link has expired' };
    }

    const steps = await OfferPackModel.getByOfferId(row.offer_id);

    return {
      candidate_name: row.candidate_name,
      job_title: row.job_title,
      position_title: row.position_title,
      base_salary: row.base_salary,
      net_salary: row.net_salary,
      offer_letter: row.offer_letter || null,
      status: computeRosterStatus(steps),
      token_expires_at: chainMeta?.token_expires_at || null,
      steps: steps.map((s) => ({
        id: s.id,
        step_order: s.step_order,
        role: s.role,
        approver_name: s.approver_name,
        status: s.status,
        note: s.note,
        decided_at: s.decided_at,
        decided_by_name: s.decided_by_name,
      })),
    };
  }

  async decideStepByToken(token, step_id, decision, note) {
    if (!DECISIONS.includes(decision)) {
      throw { status: 400, message: "Decision must be 'approved' or 'rejected'" };
    }

    const row = await OfferPackModel.getChainByToken(token);
    if (!row) throw { status: 404, message: 'Approval link not found' };

    const chainMeta = row.approval_chain;
    if (chainMeta?.finalized_at) {
      throw { status: 410, message: 'This approval chain has already been finalized' };
    }
    if (chainMeta?.token_expires_at && new Date(chainMeta.token_expires_at) < new Date()) {
      throw { status: 410, message: 'This approval link has expired' };
    }

    const steps = await OfferPackModel.getByOfferId(row.offer_id);
    if (computeRosterStatus(steps) === 'rejected') {
      throw { status: 410, message: 'This chain was already marked not approved — ask the recruiter to restart it' };
    }

    const target = steps.find((s) => s.id === Number(step_id));
    if (!target) throw { status: 404, message: 'Approval step not found on this chain' };

    const updated = await OfferPackModel.decideStep({ step_id: target.id, status: decision, note });
    if (!updated) throw { status: 409, message: 'Failed to record decision' };
    return updated;
  }

  async downloadLetterByToken(token, format) {
    const row = await OfferPackModel.getChainByToken(token);
    if (!row) throw { status: 404, message: 'Approval link not found' };

    const offer = await OfferModel.getOfferByIdPublic(row.offer_id);
    if (!offer) throw { status: 404, message: 'Offer not found' };

    if (format === 'pdf') {
      return OfferService.downloadOfferLetterPdf(row.offer_id, offer.company_id);
    }
    return OfferService.downloadOfferLetterDocx(row.offer_id, offer.company_id);
  }
}

export default new OfferPackService();