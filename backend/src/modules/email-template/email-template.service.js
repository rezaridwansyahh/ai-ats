import EmailTemplateModel from "./email-template.model.js";

export const STAGE_SCREENING = 2;
export const STAGE_ASSESSMENT = 4;
export const STAGE_OFFERING_CONTRACT = 6;

const DEFAULTS = {
  [STAGE_SCREENING]: {
    qa_invite: {
      subject: 'Follow-up Questions — {{JOB_TITLE}}',
      body: `{{CANDIDATE_NAME}},\n\nPlease answer a few follow-up questions for the {{JOB_TITLE}} position. You have 48 hours to respond:\n\n{{LINK}}`,
    },
  },
  [STAGE_ASSESSMENT]: {
    invite: {
      subject: 'Assessment Invitation — {{JOB_TITLE}}',
      body: `Hi {{CANDIDATE_NAME}},\n\nThank you for your interest in the {{JOB_TITLE}} position. As part of our selection process, we invite you to complete a psychometric assessment (Battery {{BATTERY}}).\n\nPlease access the assessment portal via the link below:\n\n{{LINK}}\n\nThis link is valid for 7 days and is personal — kindly do not share it with others.\n\nThank you,\nThe Recruitment Team`,
    },
  },
  [STAGE_OFFERING_CONTRACT]: {
    offer: {
      subject: 'Your Offer Letter — {{JOB_TITLE}}',
      body: `Hi {{CANDIDATE_NAME}},\n\nCongratulations! Please review your offer letter for the {{JOB_TITLE}} position.\n\nYou can download your offer letter, sign it, and submit your signed copy via the link below:\n\n{{LINK}}\n\nThis link is personal — kindly do not share it with others.\n\nThank you,\nThe Recruitment Team`,
    },
    contract: {
      subject: 'Your Contract — {{JOB_TITLE}}',
      body: `Hi {{CANDIDATE_NAME}},\n\nPlease review and sign your contract for the {{JOB_TITLE}} position via the link below:\n\n{{LINK}}\n\nThis link is personal — kindly do not share it with others.\n\nThank you,\nThe Recruitment Team`,
    },
  },
};

class EmailTemplateService {
  async getAllForCompany(company_id) {
    const overrides = await EmailTemplateModel.getByCompany(company_id);
    const byKey = Object.fromEntries(overrides.map(o => [`${o.stage_type_id}.${o.template_key}`, o]));

    return Object.entries(DEFAULTS).map(([stage_type_id, templates]) => ({
      stage_type_id: Number(stage_type_id),
      templates: Object.entries(templates).map(([template_key, def]) => {
        const o = byKey[`${stage_type_id}.${template_key}`];
        return {
          template_key,
          subject: o?.subject ?? def.subject,
          body: o?.body ?? def.body,
          is_customized: !!o,
        };
      }),
    }));
  }

  async getResolved(company_id, stage_type_id, template_key) {
    const o = await EmailTemplateModel.getOne(company_id, stage_type_id, template_key);
    const def = DEFAULTS[stage_type_id]?.[template_key];
    if (!def) throw { status: 400, message: 'Unknown template' };
    return { subject: o?.subject ?? def.subject, body: o?.body ?? def.body };
  }

  async save(company_id, stage_type_id, template_key, subject, body, user_id) {
    if (!DEFAULTS[stage_type_id]?.[template_key]) throw { status: 400, message: 'Unknown template' };
    if (!subject?.trim() || !body?.trim()) throw { status: 400, message: 'Subject and body are required' };
    return EmailTemplateModel.upsert(company_id, stage_type_id, template_key, subject.trim(), body, user_id);
  }
}

export default new EmailTemplateService();