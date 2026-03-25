import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
}

export default new AIService();
