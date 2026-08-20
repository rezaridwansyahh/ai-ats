import EmailTemplateModel from "./email-template.model.js";

const DEFAULTS = {
  interview: {
    qa_invite: {
      subject: 'Follow-up Questions — {{JOB_TITLE}}',
      body: `<p>{{CANDIDATE_NAME}},</p><p>Please answer a few follow-up questions for the {{JOB_TITLE}} position. You have 48 hours to respond:</p><p>{{LINK}}</p>`,
    },
    stage_advance: {
      subject: 'Invitation to next stage: {{STAGE}}',
      body: `<p>{{CANDIDATE_NAME}},</p><p>You have been invited to the next stage of the hiring process for the position of {{JOB_TITLE}}</p>`,
    },
  },
  offer: {
    offer: {
      subject: 'Your Offer Letter — {{JOB_TITLE}}',
      body: `Hi {{CANDIDATE_NAME}},\n\nCongratulations! Please review your offer letter for the {{JOB_TITLE}} position.\n\nYou can download your offer letter, sign it, and submit your signed copy via the link below:\n\n{{LINK}}\n\nThis link is personal — kindly do not share it with others.\n\nThank you,\nThe Recruitment Team`,
    },
  },
  contract: {
    contract: {
      subject: 'Your Contract — {{JOB_TITLE}}',
      body: `Hi {{CANDIDATE_NAME}},\n\nPlease review and sign your contract for the {{JOB_TITLE}} position via the link below:\n\n{{LINK}}\n\nThis link is personal — kindly do not share it with others.\n\nThank you,\nThe Recruitment Team`,
    },
  },
  assessment: {
    invite: {
      subject: 'Assessment Invitation — {{JOB_TITLE}}',
      body: `Hi {{CANDIDATE_NAME}},\n\nThank you for your interest in the {{JOB_TITLE}} position. As part of our selection process, we invite you to complete a psychometric assessment (Battery {{BATTERY}}).\n\nPlease access the assessment portal via the link below:\n\n{{LINK}}\n\nThis link is valid for 7 days and is personal — kindly do not share it with others.\n\nThank you,\nThe Recruitment Team`,
    },
  },
};

class EmailTemplateService {
  async getAllForCompany(company_id) {
    const overrides = await EmailTemplateModel.getByCompany(company_id);
    const byKey = Object.fromEntries(overrides.map(o => [`${o.module_key}.${o.template_key}`, o]));

    return Object.entries(DEFAULTS).map(([module_key, templates]) => ({
      module_key,
      templates: Object.entries(templates).map(([template_key, def]) => {
        const o = byKey[`${module_key}.${template_key}`];
        return {
          template_key,
          subject: o?.subject ?? def.subject,
          body: o?.body ?? def.body,
          is_customized: !!o,
        };
      }),
    }));
  }

  async getResolved(company_id, module_key, template_key) {
    const o = await EmailTemplateModel.getOne(company_id, module_key, template_key);
    const def = DEFAULTS[module_key]?.[template_key];
    if (!def) throw { status: 400, message: 'Unknown template' };
    return { subject: o?.subject ?? def.subject, body: o?.body ?? def.body };
  }

  async save(company_id, module_key, template_key, subject, body, user_id) {
    if (!DEFAULTS[module_key]?.[template_key]) throw { status: 400, message: 'Unknown template' };
    if (!subject?.trim() || !body?.trim()) throw { status: 400, message: 'Subject and body are required' };
    return EmailTemplateModel.upsert(company_id, module_key, template_key, subject.trim(), body, user_id);
  }
}

export default new EmailTemplateService();