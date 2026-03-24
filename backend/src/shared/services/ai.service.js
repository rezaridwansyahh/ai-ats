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

    prompt += `\nPlease respond with two sections:\n`;
    prompt += `1. **Job Description** — a compelling, detailed job description\n`;
    prompt += `2. **Qualifications** — required and preferred qualifications as bullet points\n`;
    prompt += `\nWrite in a professional tone. Do not include any markdown headers or labels like "Job Description:" — just write the content directly.`;

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
