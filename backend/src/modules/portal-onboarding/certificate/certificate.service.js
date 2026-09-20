import CertificateModel from './certificate.model.js';

class CertificateService {
  async syncFromPhases(onboarding_id, company_id, phases) {
    for (const phase of phases) {
      if (phase.status === 'done') {
        await this._issueIfMissing({
          onboarding_id,
          company_id,
          phase_id: phase.id,
          title: phase.label,
        });
      }
    }

    const allDone = phases.length > 0 && phases.every((p) => p.status === 'done');
    if (allDone) {
      await this._issueIfMissing({
        onboarding_id,
        company_id,
        phase_id: null,
        title: 'Onboarding Program',
      });
    }
  }

  async _issueIfMissing({ onboarding_id, company_id, phase_id, title }) {
    const existing = await CertificateModel.getByPhase(onboarding_id, phase_id);
    if (existing) return existing;
    return CertificateModel.create({ onboarding_id, company_id, phase_id, title });
  }

  async listForCandidate(onboarding_id) {
    return CertificateModel.getByOnboarding(onboarding_id);
  }

  async getOne(onboarding_id, certificate_id) {
    const cert = await CertificateModel.getById(certificate_id);
    if (!cert || cert.onboarding_id !== Number(onboarding_id)) {
      throw { status: 404, message: 'Certificate not found.' };
    }
    return cert;
  }
}

export default new CertificateService();