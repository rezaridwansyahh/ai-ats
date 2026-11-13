import OpenAI from 'openai';

const MODEL = 'gpt-4o-mini';

let client;
function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw { status: 503, message: 'OPENAI_API_KEY is not set in .env.dev' };
  }
  return (client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));
}

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

    let response;
    try {
      response = await getClient().chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      });
    } catch (err) {
      console.error('OpenAI request failed:', err.status, err.message);
      throw { status: 502, message: 'AI service is unavailable, please try again' };
    }

    const summary = response.choices[0]?.message?.content?.trim();
    if (!summary) throw { status: 502, message: 'AI returned an empty summary, please try again' };
    return summary;
  }
}

export default new AIService();