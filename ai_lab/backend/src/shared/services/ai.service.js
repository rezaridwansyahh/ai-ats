import OpenAI from 'openai';
import { isRealDate } from '../utils/date.util.js';

const MODEL = 'gpt-4o-mini';

let client;
function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw { status: 503, message: 'OPENAI_API_KEY is not set in .env.dev' };
  }
  return (client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));
}

async function complete(params) {
  try {
    return await getClient().chat.completions.create({ model: MODEL, ...params });
  } catch (err) {
    console.error('OpenAI request failed:', err.status, err.message);
    throw { status: 502, message: 'AI service is unavailable, please try again' };
  }
}

const FIELD_ORDER = ['nama', 'jk', 'tgl_lahir', 'pendidikan', 'divisi', 'jabatan', 'lokasi', 'status', 'tgl_masuk', 'akhir_kontrak', 'email'];
const DATE_FIELDS = ['tgl_lahir', 'tgl_masuk', 'akhir_kontrak'];
const ENUMS = {
  jk: ['Laki-laki', 'Perempuan'],
  pendidikan: ['SD/SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3'],
  status: ['PKWTT', 'PKWT', 'Magang'],
};

class AIService {
  // Returns the summary as a plain string.
  async summarizeEmployee(facts) {
    const prompt = `Kamu adalah asisten HR. Tulis ringkasan singkat tentang SATU karyawan berdasarkan fakta di bawah ini.

Aturan:
- Bahasa Indonesia, nada profesional dan netral.
- 2-4 kalimat dalam satu paragraf, tanpa judul, tanpa poin-poin.
- Pakai hanya fakta yang diberikan; jangan menebak atau menambah informasi.
- Sebut tanggal secara absolut (mis. "berakhir 14 Desember 2026"), jangan "N hari lagi", karena ringkasan ini disimpan dan bisa dibaca di hari lain.
- Jangan menyebut nama; tulis "Karyawan ini".
- Jika "data_belum_lengkap" tidak kosong, sebutkan data apa yang belum lengkap.
- Akhiri dengan satu kalimat tindakan paling relevan untuk HR/atasan. Jika tidak ada yang mendesak, akhiri dengan "Tidak ada tindakan mendesak."

FAKTA:
${JSON.stringify(facts, null, 2)}`;

    const response = await complete({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    const summary = response.choices[0]?.message?.content?.trim();
    if (!summary) throw { status: 502, message: 'AI returned an empty summary, please try again' };
    return summary;
  }

  async extractEmployeeFromDocument(buffer, filename, mimetype) {
    const dataUrl = `data:${mimetype};base64,${buffer.toString('base64')}`;
    const filePart = mimetype === 'application/pdf'
      ? { type: 'file', file: { filename, file_data: dataUrl } }
      : { type: 'image_url', image_url: { url: dataUrl } };

    const shape = FIELD_ORDER.map((k) => `  "${k}": { "value": string|null, "confidence": 0-1, "note": string }`).join(',\n');
    const prompt = `You are reading a filled-in Indonesian employee data form (handwritten or typed). Extract the fields below and return STRICT JSON only (no prose, no markdown):

{
${shape}
}

Rules:
- "value" is null when the field is blank or not on the form. Never guess or infer a value that is not written.
- "confidence" is how sure you are that you read the value correctly (0 to 1). Lower it for unclear handwriting, smudges, or characters that look alike (e.g. 1/7, 0/6).
- "note" is a short explanation ONLY when confidence is below 0.9 or the form is ambiguous (e.g. what looks unclear), otherwise "".
- Dates must be YYYY-MM-DD. Convert from the form's format (e.g. "14 - 03 - 2001" → "2001-03-14").
- jk must be exactly "Laki-laki" or "Perempuan".
- pendidikan must be exactly one of: ${ENUMS.pendidikan.join(', ')}.
- status must be exactly one of: ${ENUMS.status.join(', ')}.
- Copy names, divisions and job titles as written, including spelling mistakes.
- Do NOT read or return ID numbers (KTP, NPWP, BPJS) or phone numbers.`;

    const response = await complete({
      messages: [{ role: 'user', content: [filePart, { type: 'text', text: prompt }] }],
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    let parsed;
    try {
      parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch {
      throw { status: 502, message: 'AI returned an unreadable answer, please try again' };
    }

    const fields = {};
    for (const key of FIELD_ORDER) {
      const raw = parsed[key] ?? {};
      let value = typeof raw.value === 'string' && raw.value.trim() ? raw.value.trim() : null;
      let note = typeof raw.note === 'string' ? raw.note.trim() : '';

      // Never trust the model's formatting: anything the table would reject becomes "not read".
      if (value && ENUMS[key] && !ENUMS[key].includes(value)) { value = null; note = note || 'Value not recognised'; }
      if (value && DATE_FIELDS.includes(key) && !isRealDate(value)) { value = null; note = note || 'Date not readable'; }

      const c = Number(raw.confidence);
      fields[key] = { value, confidence: value && Number.isFinite(c) ? Math.max(0, Math.min(1, c)) : 0, note };
    }

    if (FIELD_ORDER.every((k) => fields[k].value === null)) {
      throw { status: 422, message: 'No employee data could be read from this document' };
    }
    return fields;
  }
}

export default new AIService();