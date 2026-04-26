import OpenAI from 'openai';
import { normalizeSkills } from '../../modules/screening/skill-normalizer.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SCORING_MODEL = 'gpt-4o-mini';
const CV_TEXT_LIMIT = 8000;

function safeNumber(value, min = 0, max = 100) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function safeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim());
}

class AIService {
  buildPrompt(formFields, fileText) {
    let prompt = `You are an expert HR recruiter. Generate a professional job description and qualifications based on the following information.\n\n`;

    prompt += `## Job Details\n`;
    if (formFields.job_title) prompt += `- Job Title: ${formFields.job_title}\n`;
    if (formFields.job_location) prompt += `- Location: ${formFields.job_location}\n`;
    if (formFields.work_option) prompt += `- Work Option: ${formFields.work_option}\n`;
    if (formFields.work_type) prompt += `- Work Type: ${formFields.work_type}\n`;
    if (formFields.seniority_level) prompt += `- Seniority Level: ${formFields.seniority_level}\n`;
    if (formFields.company) prompt += `- Company: ${formFields.company}\n`;
    if (formFields.pay_min && formFields.pay_max) {
      prompt += `- Salary Range: ${formFields.currency || ''} ${formFields.pay_min} - ${formFields.pay_max} (${formFields.pay_type || ''})\n`;
    }

    if (fileText) {
      prompt += `\n## Reference Document (CV/Job Spec)\n${fileText.slice(0, 4000)}\n`;
      prompt += `\nUse the document above as reference to tailor the job description and required qualifications.\n`;
    }

    prompt += `\nIMPORTANT: You MUST structure your response using these EXACT tags. Do NOT omit them:\n\n`;
    prompt += `[JOB_DESC]\nWrite the job description here\n[/JOB_DESC]\n[QUALIFICATIONS]\nWrite required and preferred qualifications as bullet points here\n[/QUALIFICATIONS]\n\n`;
    prompt += `Rules:\n- Always start with [JOB_DESC] and end with [/QUALIFICATIONS]\n- Never skip the tags\n- Write in a professional tone`;

    return prompt;
  }

  async *generateStream(formFields, fileText) {
    const prompt = this.buildPrompt(formFields, fileText);

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
  }

  // Layer 1 — extract structured facets from raw CV text.
  async extractFacets(cvText) {
    if (!cvText || typeof cvText !== 'string') {
      throw new Error('extractFacets: cvText is required');
    }
    const trimmed = cvText.slice(0, CV_TEXT_LIMIT);

    const prompt = `You are a CV parser. Extract structured facets from the CV text below and return STRICT JSON matching this schema (no prose, no markdown):

{
  "job_position": { "current": string, "category": string },
  "skills": string[],
  "education": [
    { "school": string, "degree": string, "year": number|null, "tier": "top"|"mid"|"other" }
  ],
  "experience": {
    "years_total": number,
    "positions": [ { "title": string, "company": string, "years": number } ]
  }
}

Rules:
- "category" is a coarse role category like "Frontend", "Backend", "Full Stack", "Data", "Product Design", "Mobile", "DevOps", "Product Management", "QA", "Recruiting".
- "tier" classifies the school: top (globally renowned, e.g. Harvard, MIT, Stanford, NUS), mid (well-known regional/national universities), other.
- "years_total" is approximate total years of professional experience.
- Skills should be concise tags (e.g. "React", "PostgreSQL"), not sentences.
- If a field is unknown, return a sensible default ("" for strings, 0 for numbers, [] for arrays). Do NOT add commentary.

CV:
"""
${trimmed}
"""`;

    const response = await openai.chat.completions.create({
      model: SCORING_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const raw = response.choices[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('extractFacets: model returned non-JSON');
    }

    const skills = await normalizeSkills(parsed.skills);

    const facets = {
      job_position: {
        current: typeof parsed.job_position?.current === 'string' ? parsed.job_position.current : '',
        category: typeof parsed.job_position?.category === 'string' ? parsed.job_position.category : '',
      },
      skills,
      education: Array.isArray(parsed.education)
        ? parsed.education
            .filter((e) => e && typeof e === 'object')
            .map((e) => ({
              school: typeof e.school === 'string' ? e.school : '',
              degree: typeof e.degree === 'string' ? e.degree : '',
              year: Number.isFinite(Number(e.year)) ? Number(e.year) : null,
              tier: ['top', 'mid', 'other'].includes(e.tier) ? e.tier : 'other',
            }))
        : [],
      experience: {
        years_total: safeNumber(parsed.experience?.years_total, 0, 60) ?? 0,
        positions: Array.isArray(parsed.experience?.positions)
          ? parsed.experience.positions
              .filter((p) => p && typeof p === 'object')
              .map((p) => ({
                title: typeof p.title === 'string' ? p.title : '',
                company: typeof p.company === 'string' ? p.company : '',
                years: safeNumber(p.years, 0, 60) ?? 0,
              }))
          : [],
      },
    };

    return facets;
  }

  // Layer 2 — score an applicant's facets against a specific job.
  async scoreApplicantAgainstJob(job, facets) {
    if (!job || typeof job !== 'object') throw new Error('scoreApplicantAgainstJob: job is required');
    if (!facets || typeof facets !== 'object') throw new Error('scoreApplicantAgainstJob: facets are required');

    const jobPayload = {
      job_title: job.job_title || '',
      job_desc: typeof job.job_desc === 'string' ? job.job_desc.slice(0, 4000) : '',
      qualifications: typeof job.qualifications === 'string' ? job.qualifications.slice(0, 2000) : '',
      required_skills: Array.isArray(job.required_skills) ? job.required_skills : [],
      preferred_skills: Array.isArray(job.preferred_skills) ? job.preferred_skills : [],
      seniority_level: job.seniority_level || '',
      work_type: job.work_type || '',
    };

    const prompt = `You are an expert technical recruiter. Score how well a candidate's parsed CV facets match a job. Return STRICT JSON only:

{
  "overall_score": 0-100,
  "position_score": 0-100,
  "skills_score": 0-100,
  "education_score": 0-100,
  "experience_score": 0-100,
  "matched_skills": string[],
  "missing_skills": string[],
  "summary": "2-3 sentence recruiter-facing explanation"
}

Scoring guidance:
- position_score: how well candidate's role/category aligns with the job title.
- skills_score: weighted by required (heavy) vs preferred (light); compute matched/missing from required + preferred lists.
- education_score: degree relevance + school tier vs qualifications.
- experience_score: years_total and prior titles vs seniority_level.
- overall_score: weighted blend (skills 40%, experience 25%, position 20%, education 15%) but use judgement.
- matched_skills/missing_skills should reference the job's required+preferred skill names.
- summary is for a recruiter — be specific, mention strengths and gaps.

JOB:
${JSON.stringify(jobPayload, null, 2)}

CANDIDATE FACETS:
${JSON.stringify(facets, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: SCORING_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const raw = response.choices[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('scoreApplicantAgainstJob: model returned non-JSON');
    }

    return {
      overall_score: safeNumber(parsed.overall_score) ?? 0,
      position_score: safeNumber(parsed.position_score),
      skills_score: safeNumber(parsed.skills_score),
      education_score: safeNumber(parsed.education_score),
      experience_score: safeNumber(parsed.experience_score),
      matched_skills: safeStringArray(parsed.matched_skills),
      missing_skills: safeStringArray(parsed.missing_skills),
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    };
  }
}

export default new AIService();
