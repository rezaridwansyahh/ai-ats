import aiService, { VALID_SECTIONS } from './assessment-ai.service.js';

function stripPII(profile = {}) {
  if (!profile || typeof profile !== 'object') return {};
  const { name, email, date_birth, ...rest } = profile; // eslint-disable-line no-unused-vars
  return rest;
}

function isValidBattery(b) {
  return ['A', 'B', 'C', 'D'].includes(b);
}

class AssessmentAIController {
  async generateSection(req, res) {
    try {
      const { battery, section, scores, profile = {} } = req.body || {};

      if (!isValidBattery(battery)) {
        return res.status(400).json({ message: 'battery harus salah satu dari A, B, C, D' });
      }
      if (!VALID_SECTIONS[battery].includes(section)) {
        return res.status(400).json({
          message: `section "${section}" tidak valid untuk Battery ${battery}`,
          valid: VALID_SECTIONS[battery],
        });
      }
      if (!scores || typeof scores !== 'object') {
        return res.status(400).json({ message: 'scores wajib berupa objek' });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const ctx = {
        company_id: req.user?.company_id ?? null,
        user_id:    req.user?.user_id    ?? null,
      };

      for await (const chunk of aiService.generateSection(
        { battery, section, scores, profile: stripPII(profile) },
        ctx,
      )) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      if (!res.headersSent) {
        return res.status(err.status || 500).json({ message: err.message });
      }
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }

  async generateSynthesis(req, res) {
    try {
      const { battery, allScores, sectionInterpretations, profile = {} } = req.body || {};

      if (!isValidBattery(battery)) {
        return res.status(400).json({ message: 'battery harus salah satu dari A, B, C, D' });
      }
      if (!allScores || typeof allScores !== 'object') {
        return res.status(400).json({ message: 'allScores wajib berupa objek' });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const ctx = {
        company_id: req.user?.company_id ?? null,
        user_id:    req.user?.user_id    ?? null,
      };

      for await (const chunk of aiService.generateSynthesis(
        {
          battery,
          allScores,
          sectionInterpretations: sectionInterpretations || {},
          profile: stripPII(profile),
        },
        ctx,
      )) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      if (!res.headersSent) {
        return res.status(err.status || 500).json({ message: err.message });
      }
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
}

export default new AssessmentAIController();
