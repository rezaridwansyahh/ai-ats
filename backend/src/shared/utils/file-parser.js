import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';

export async function parseFileToText(file) {
  const ext = file.originalname.toLowerCase();

  if (ext.endsWith('.pdf')) {
    // pdf-parse's TrueType renderer emits "TT: undefined function: N" via console.warn
    // regardless of verbosityLevel — silence it for the duration of the parse
    const _warn = console.warn;
    console.warn = () => {};
    let data;
    try {
      data = await pdfParse(file.buffer, { verbosityLevel: 0 });
    } finally {
      console.warn = _warn;
    }
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
