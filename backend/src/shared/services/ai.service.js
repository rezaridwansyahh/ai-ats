import OpenAI from 'openai';
import { normalizeSkills } from '../../modules/screening/skill-normalizer.js';
import companyUsageService from '../../modules/company-usage/company-usage.service.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SCORING_MODEL = 'gpt-4o-mini';
const STREAM_MODEL  = 'gpt-4o-mini';
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
  // Centralised usage logger — fire-and-forget, never throws.
  async _logUsage({ context, model, operation, usage, request_id, metadata }) {
    if (!usage) return;
    return companyUsageService.log({
      context: context || {},
      model,
      operation,
      usage,
      request_id: request_id || null,
      metadata: metadata || null,
    });
  }

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

  async *generateStream(formFields, fileText, context = {}) {
    // Task 6.12: Check AI budget before OpenAI call
    await companyUsageService.checkBudgetOrThrow(context.company_id);

    const prompt = this.buildPrompt(formFields, fileText);

    const stream = await openai.chat.completions.create({
      model: STREAM_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      stream_options: { include_usage: true },
    });

    let usage = null;
    let request_id = null;
    for await (const chunk of stream) {
      if (chunk.id && !request_id) request_id = chunk.id;
      if (chunk.usage) usage = chunk.usage;
      const text = chunk.choices?.[0]?.delta?.content;
      if (text) yield text;
    }

    await this._logUsage({
      context,
      model: STREAM_MODEL,
      operation: 'generate_job_desc',
      usage,
      request_id,
      metadata: { job_title: formFields?.job_title || null },
    });
  }

  // Layer 1 — extract structured facets from raw CV text.
  async extractFacets(cvText, context = {}) {
    if (!cvText || typeof cvText !== 'string') {
      throw new Error('extractFacets: cvText is required');
    }

    // Task 6.12: Check AI budget before OpenAI call
    await companyUsageService.checkBudgetOrThrow(context.company_id);

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

    await this._logUsage({
      context,
      model: SCORING_MODEL,
      operation: 'extract_facets',
      usage: response.usage,
      request_id: response.id,
      metadata: context.metadata || null,
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
  async scoreApplicantAgainstJob(job, facets, context = {}) {
    if (!job || typeof job !== 'object') throw new Error('scoreApplicantAgainstJob: job is required');
    if (!facets || typeof facets !== 'object') throw new Error('scoreApplicantAgainstJob: facets are required');

    // Task 6.12: Check AI budget before OpenAI call
    await companyUsageService.checkBudgetOrThrow(context.company_id);

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

    await this._logUsage({
      context,
      model: SCORING_MODEL,
      operation: 'score_applicant',
      usage: response.usage,
      request_id: response.id,
      metadata: { job_title: job.job_title || null, ...(context.metadata || {}) },
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

  // Layer 2 (rubric flow) — score one candidate against a job using a recruiter-defined rubric.
  // The LLM scores each criterion 0-100 independently. The backend computes overall_score
  // deterministically from the rubric weights, so the LLM doesn't have to do math.
  async scoreWithRubric(job, facets, rubric, role_profile, context = {}) {
    if (!job || typeof job !== 'object') throw new Error('scoreWithRubric: job is required');
    if (!facets || typeof facets !== 'object') throw new Error('scoreWithRubric: facets are required');
    if (!rubric || typeof rubric !== 'object') throw new Error('scoreWithRubric: rubric is required');

    // Task 6.12: Check AI budget before OpenAI call
    await companyUsageService.checkBudgetOrThrow(context.company_id);

    const fixed = rubric.fixed_criteria || {};
    const customCriteria = Array.isArray(rubric.custom_criteria) ? rubric.custom_criteria : [];

    const jobPayload = {
      job_title: job.job_title || '',
      job_desc: typeof job.job_desc === 'string' ? job.job_desc.slice(0, 4000) : '',
      qualifications: typeof job.qualifications === 'string' ? job.qualifications.slice(0, 2000) : '',
      required_skills: Array.isArray(job.required_skills) ? job.required_skills : [],
      preferred_skills: Array.isArray(job.preferred_skills) ? job.preferred_skills : [],
      seniority_level: job.seniority_level || '',
      work_type: job.work_type || '',
    };

    const profile = role_profile === 'fresh_graduate' ? 'Fresh Graduate' : 'Experienced';
    const profileGuidance = role_profile === 'fresh_graduate'
      ? 'Score as a fresh graduate. Lack of senior titles or long tenures should NOT penalize. Weigh education and learning velocity higher.'
      : 'Score as an experienced hire. Years, role progression, and prior responsibilities matter.';

    const customBlock = customCriteria.length === 0
      ? '(none)'
      : customCriteria
          .map((c, i) => `  ${i + 1}. "${c.description}" (weight ${c.weight}%)`)
          .join('\n');

    const prompt = `You are an expert recruiter. Score this candidate against this job using the rubric below. Return STRICT JSON only.

ROLE PROFILE: ${profile}
${profileGuidance}

JOB:
${JSON.stringify(jobPayload, null, 2)}

CANDIDATE FACETS:
${JSON.stringify(facets, null, 2)}

RUBRIC — score each criterion independently from 0 to 100.

Fixed criteria:
1. skills (weight ${fixed.skills?.weight ?? 0}%) — Match against the job's required + preferred skills. Heavily favour required-skill coverage.
2. experience (weight ${fixed.experience?.weight ?? 0}%) — Years total, role relevance, and progression vs the seniority asked.
3. career_trajectory (weight ${fixed.career_trajectory?.weight ?? 0}%) — Tenure pattern, stability, growth across prior roles. If ambiguous from CV alone, mark in summary that this needs Q&A in the interview.
4. education (weight ${fixed.education?.weight ?? 0}%) — Degree relevance, school tier vs qualifications.

Custom criteria (each scored 0-100):
${customBlock}

Return STRICT JSON:
{
  "skills_score": 0-100,
  "experience_score": 0-100,
  "career_trajectory_score": 0-100,
  "education_score": 0-100,
  "matched_skills": string[],
  "missing_skills": string[],
  "custom_criteria_results": [
    { "description": "<echo the description verbatim>", "score": 0-100, "note": "<one short sentence>" }
  ],
  "summary": "2-3 sentence recruiter-facing explanation. Mention any item that needs Q&A validation."
}`;

    const response = await openai.chat.completions.create({
      model: SCORING_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    await this._logUsage({
      context,
      model: SCORING_MODEL,
      operation: 'score_with_rubric',
      usage: response.usage,
      request_id: response.id,
      metadata: {
        job_title: job.job_title || null,
        role_profile,
        ...(context.metadata || {}),
      },
    });

    const raw = response.choices[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('scoreWithRubric: model returned non-JSON');
    }

    const customResults = Array.isArray(parsed.custom_criteria_results)
      ? parsed.custom_criteria_results
          .filter((r) => r && typeof r === 'object')
          .map((r) => ({
            description: typeof r.description === 'string' ? r.description : '',
            score: safeNumber(r.score) ?? 0,
            note: typeof r.note === 'string' ? r.note : '',
          }))
      : [];

    return {
      skills_score:            safeNumber(parsed.skills_score)            ?? 0,
      experience_score:        safeNumber(parsed.experience_score)        ?? 0,
      career_trajectory_score: safeNumber(parsed.career_trajectory_score) ?? 0,
      education_score:         safeNumber(parsed.education_score)         ?? 0,
      matched_skills: safeStringArray(parsed.matched_skills),
      missing_skills: safeStringArray(parsed.missing_skills),
      custom_criteria_results: customResults,
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    };
  }


  async generateFollowupQuestions(job, facets, { focusArea, numQuestions, language } = {}, context = {}) {
    if (!job || typeof job !== 'object') throw new Error('generateFollowupQuestions: job is required');
    if (!facets || typeof facets !== 'object') throw new Error('generateFollowupQuestions: facets are required');

    // Task 6.12: Check AI budget before OpenAI call
    await companyUsageService.checkBudgetOrThrow(context.company_id);

    const count = Math.max(2, Math.min(6, Number(numQuestions) || 3));
    const focus = typeof focusArea === 'string' && focusArea.trim() ? focusArea.trim() : 'technical depth + culture fit';
    const langMap = {
      'id-en': 'Mixed Bahasa Indonesia and English — write each question in Bahasa Indonesia but keep technical terms in English.',
      en: 'English only.',
      id: 'Bahasa Indonesia only.',
    };
    // Locked to Bahasa Indonesia for now — questions are always written in Bahasa
    // regardless of the requested `language`.
    const langGuidance = langMap['id'];

    const jobPayload = {
      job_title: job.job_title || '',
      job_desc: typeof job.job_desc === 'string' ? job.job_desc.slice(0, 4000) : '',
      qualifications: typeof job.qualifications === 'string' ? job.qualifications.slice(0, 2000) : '',
      required_skills: Array.isArray(job.required_skills) ? job.required_skills : [],
      preferred_skills: Array.isArray(job.preferred_skills) ? job.preferred_skills : [],
      seniority_level: job.seniority_level || '',
      job_location: job.job_location || '',
      work_option: job.work_option || '',   // On-site | Hybrid | Remote
      work_type: job.work_type || '',       // Full-time | Part-time | Contract | Casual
      benefits: job.benefits ?? [],
      compensation: {
        pay_type: job.pay_type || null,     // Hourly | Monthly | Annually
        currency: job.currency || null,
        pay_min: job.pay_min ?? null,
        pay_max: job.pay_max ?? null,
        pay_display: job.pay_display || null, // Show | Hide
      },
    };

    const prompt = `You are an expert recruiter writing follow-up screening questions for a borderline candidate, to validate fit before an interview. Return STRICT JSON only.

FOCUS AREA: ${focus}
NUMBER OF QUESTIONS: exactly ${count}
LANGUAGE: ${langGuidance}

JOB:
${JSON.stringify(jobPayload, null, 2)}

CANDIDATE FACETS (parsed from CV):
${JSON.stringify(facets, null, 2)}

Write ${count} sharp, specific questions tuned to THIS candidate's gaps vs THIS job. Avoid generic questions; probe ambiguous tenure, missing required skills, and claims that need validation. Give each question a short topic label.

When the FOCUS AREA concerns job requirements or compensation, ground the questions in the JOB's stated compensation, benefits, work arrangement (work_option / work_type), location, qualifications and skills — e.g. confirm the candidate's salary expectation against the offered range, their availability / earliest start date, and their willingness regarding the work arrangement and location. ONLY quote specific salary figures if compensation.pay_display is "Show"; if it is "Hide" or absent, ask about the candidate's salary expectation WITHOUT revealing the offered range.

Return STRICT JSON:
{
  "questions": [
    { "topic": "<2-4 word label, e.g. 'Technical depth'>", "text": "<the question>" }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: SCORING_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    await this._logUsage({
      context,
      model: SCORING_MODEL,
      operation: 'generate_followup_qa',
      usage: response.usage,
      request_id: response.id,
      metadata: {
        job_title: job.job_title || null,
        focus_area: focus,
        num_questions: count,
        ...(context.metadata || {}),
      },
    });

    const raw = response.choices[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('generateFollowupQuestions: model returned non-JSON');
    }

    const questions = Array.isArray(parsed.questions)
      ? parsed.questions
          .filter((q) => q && typeof q === 'object' && typeof q.text === 'string' && q.text.trim())
          .map((q) => ({
            topic: typeof q.topic === 'string' ? q.topic.trim() : '',
            text: q.text.trim(),
          }))
          .slice(0, count)
      : [];

    if (questions.length === 0) throw new Error('generateFollowupQuestions: model returned no questions');

    return { questions };
  }


  async generateInterviewQuestions(job, { numQuestions, language } = {}, context = {}) {
    if (!job || typeof job !== 'object') throw new Error('generateInterviewQuestions: job is required');
 
    await companyUsageService.checkBudgetOrThrow(context.company_id);
 
    const count = Math.max(3, Math.min(15, Number(numQuestions) || 8));
 
    const langMap = {
      en:      'English only.',
      id:      'Bahasa Indonesia only.',
      'id-en': 'Mixed Bahasa Indonesia and English — write each question in Bahasa Indonesia but keep technical terms in English.',
    };
    const langGuidance = langMap[language] || langMap['id'];
 
    const jobPayload = {
      job_title:        job.job_title        || '',
      job_desc:         typeof job.job_desc === 'string'       ? job.job_desc.slice(0, 4000)       : '',
      qualifications:   typeof job.qualifications === 'string' ? job.qualifications.slice(0, 2000) : '',
      required_skills:  Array.isArray(job.required_skills)     ? job.required_skills               : [],
      preferred_skills: Array.isArray(job.preferred_skills)    ? job.preferred_skills              : [],
      seniority_level:  job.seniority_level  || '',
      work_type:        job.work_type        || '',
    };
 
    const prompt = `You are an expert recruiter writing structured interview questions for a position. Return STRICT JSON only.
 
NUMBER OF QUESTIONS: exactly ${count}
LANGUAGE: ${langGuidance}
 
JOB:
${JSON.stringify(jobPayload, null, 2)}
 
Write ${count} sharp, specific interview questions tailored to this role. Each question must:
- Map to one of the standard competency codes: HRD-01 (Leadership), HRD-02 (Planning & Organizing), HRD-03 (Problem Solving & Decision Making), HRD-04 (Value for Best Quality), HRD-05 (Creativity), HRD-06 (Teamwork).
- Be behavioural (STAR-method friendly) where possible — ask about past experience, not hypotheticals.
- Include an optional follow-up probe to dig deeper.
 
Return STRICT JSON:
{
  "questions": [
    {
      "competency": "<competency_code e.g. HRD-01>",
      "source": "jd_generated",
      "text": "<the interview question>",
      "follow_up": "<one short follow-up probe, or null>"
    }
  ]
}`;
 
    const response = await openai.chat.completions.create({
      model: SCORING_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });
 
    await this._logUsage({
      context,
      model:      SCORING_MODEL,
      operation:  'generate_interview_questions',
      usage:      response.usage,
      request_id: response.id,
      metadata: {
        job_title:     job.job_title || null,
        num_questions: count,
        ...(context.metadata || {}),
      },
    });
 
    const raw = response.choices[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('generateInterviewQuestions: model returned non-JSON');
    }
 
    const validCompetencies = ['HRD-01', 'HRD-02', 'HRD-03', 'HRD-04', 'HRD-05', 'HRD-06'];
 
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions
          .filter((q) => q && typeof q === 'object' && typeof q.text === 'string' && q.text.trim())
          .map((q, i) => ({
            id:        i + 1,
            competency: validCompetencies.includes(q.competency) ? q.competency : null,
            source:    'jd_generated',
            text:      q.text.trim(),
            follow_up: typeof q.follow_up === 'string' && q.follow_up.trim() ? q.follow_up.trim() : null,
          }))
          .slice(0, count)
      : [];
 
    if (questions.length === 0) throw new Error('generateInterviewQuestions: model returned no questions');
 
    return { questions };
  }

  async extractBgClaims(information, job_title, context = {}) {
    if (!information || typeof information !== 'object') {
      throw new Error('extractBgClaims: information is required');
    }

    await companyUsageService.checkBudgetOrThrow(context.company_id);

    const prompt = `You are an HR background check specialist. Extract verifiable claims from a candidate's parsed CV data. Return STRICT JSON only.

  JOB TITLE: ${job_title || 'Not specified'}

  CANDIDATE CV DATA:
  ${JSON.stringify(information, null, 2)}

  Extract every verifiable statement and classify each into a lane. Return STRICT JSON:
  {
    "claims": [
      {
        "claim_text": "<primary label, concise — e.g. 'Universitas Indonesia · S1 Ilmu Komputer · 2018'>",
        "claim_detail": "<optional secondary detail — e.g. 'IPK 3.62' or 'ref: Bu Lestari (manager)' or null>",
        "lane_type": "<identity|edu|emp|cert|crim|cred|salary>"
      }
    ]
  }

  Lane classification rules:
  - identity  → KTP, NIK, passport, full legal name verification
  - edu       → each education entry (school, degree, graduation year)
  - emp       → each employment position (company, title, tenure)
  - cert      → professional certifications, licenses
  - crim      → criminal record (only if explicitly mentioned)
  - cred      → credit / financial history (only if relevant to role)
  - salary    → last drawn salary, compensation claims

  Rules:
  - Create one claim per verifiable item — do NOT bundle multiple positions into one claim
  - claim_text should be short and scannable (max ~80 chars)
  - claim_detail is optional extra context the recruiter needs to verify
  - If a field is not present in the CV data, skip that lane entirely
  - Do NOT invent claims — only extract what is explicitly in the data
  - Order: identity first, then edu, then emp (most recent first), then cert`;

    const response = await openai.chat.completions.create({
      model: SCORING_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    await this._logUsage({
      context,
      model: SCORING_MODEL,
      operation: 'extract_bg_claims',
      usage: response.usage,
      request_id: response.id,
      metadata: {
        job_title: job_title || null,
        ...(context.metadata || {}),
      },
    });

    const raw = response.choices[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('extractBgClaims: model returned non-JSON');
    }

    const validLanes = ['identity', 'edu', 'emp', 'cert', 'crim', 'cred', 'salary'];

    const claims = Array.isArray(parsed.claims)
      ? parsed.claims
          .filter((c) => c && typeof c === 'object' &&
            typeof c.claim_text === 'string' && c.claim_text.trim() &&
            validLanes.includes(c.lane_type))
          .map((c) => ({
            claim_text:   c.claim_text.trim(),
            claim_detail: typeof c.claim_detail === 'string' && c.claim_detail.trim()
              ? c.claim_detail.trim()
              : null,
            lane_type: c.lane_type,
          }))
      : [];

    if (claims.length === 0) {
      throw new Error('extractBgClaims: model returned no valid claims');
    }

    return { claims };
  }

}

export default new AIService();
