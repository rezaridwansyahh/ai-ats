import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';

export async function parseFileToText(file) {
  const ext = file.originalname.toLowerCase();

  if (ext.endsWith('.pdf')) {
    // Suppress "TT: undefined function: N" warnings from pdf-parse's internal renderer
    const data = await pdfParse(file.buffer, { verbosityLevel: 0 });
    return data.text;
  }

  if (ext.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }

  if (ext.endsWith('.txt')) {
    return file.buffer.toString('utf-8');
  }

  throw new Error('Unsupported file type');
}
