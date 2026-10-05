import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const PdfPrinterMod = require('pdfmake');
const PdfPrinter = PdfPrinterMod.default || PdfPrinterMod;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, '../../../shared/fonts/roboto');

const fonts = {
  Roboto: {
    normal: path.join(FONTS_DIR, 'Roboto-Regular.ttf'),
    bold: path.join(FONTS_DIR, 'Roboto-Medium.ttf'),
    italics: path.join(FONTS_DIR, 'Roboto-Italic.ttf'),
    bolditalics: path.join(FONTS_DIR, 'Roboto-MediumItalic.ttf'),
  },
};

const BATTERY_BY_ASSESSMENT_ID = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'I', 6: 'T' };

function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
}

// `answer` shape varies by question_type (plain string/number for mc/input/
// yes_no, an object for compound types like DISC's forced-choice quad) —
// never seen a row that doesn't stringify cleanly, but this guards against
// one that doesn't rather than letting the whole export 500.
function formatAnswer(answer) {
  if (answer == null || answer === '') return '—';
  if (typeof answer === 'string' || typeof answer === 'number') return String(answer);
  try { return JSON.stringify(answer); } catch { return String(answer); }
}

// Groups the already subtest/question-ordered rows from
// AssessmentAnswer.getByResultIdWithQuestions into { subtest_name, rows[] }
// sections, preserving that same order.
function groupBySubtest(answers) {
  const sections = [];
  let current = null;
  for (const row of answers) {
    if (!current || current.subtest_id !== row.subtest_id) {
      current = { subtest_id: row.subtest_id, subtest_name: row.subtest_name, rows: [] };
      sections.push(current);
    }
    current.rows.push(row);
  }
  return sections;
}

function questionBlock(row) {
  const text = row.question_content?.text?.trim() || '(no question text)';
  const hasCorrect = row.question_content?.correct != null && row.is_correct != null;
  const lines = [
    {
      columns: [
        { text: `${row.question_order}.`, width: 24, style: 'qNum' },
        { text, style: 'qText' },
      ],
    },
    {
      text: [
        { text: 'Jawaban: ', style: 'aLabel' },
        { text: formatAnswer(row.answer), style: 'aValue' },
      ],
      margin: [24, 2, 0, 0],
    },
  ];
  if (hasCorrect) {
    lines.push({
      text: [
        { text: row.is_correct ? 'Benar' : 'Salah', style: row.is_correct ? 'correct' : 'incorrect' },
        { text: `  (kunci: ${formatAnswer(row.question_content.correct)})`, style: 'aLabel' },
      ],
      margin: [24, 1, 0, 8],
    });
  } else {
    lines.push({ text: '', margin: [0, 0, 0, 6] });
  }
  return lines;
}

// Per-candidate transcript of every answered question (text + what they
// picked), grouped by subtest — distinct from buildAssessmentReportPdf,
// which is the scored/narrative report. Only includes questions that were
// actually answered (assessment_answer rows); unanswered/skipped questions
// are silently absent rather than shown as blank, since there's no "skipped"
// state recorded — a question is either answered or has no row at all.
export async function buildAssessmentQaPdf(result, answers) {
  const battery = BATTERY_BY_ASSESSMENT_ID[result.assessment_id] || '—';
  const sections = groupBySubtest(answers);

  const content = [
    { text: 'TRANSKRIP JAWABAN ASESMEN', style: 'title' },
    {
      columns: [
        [
          { text: `Nama: ${result.candidate_name || '—'}`, style: 'meta' },
          { text: `Email: ${result.candidate_email || '—'}`, style: 'meta' },
        ],
        [
          { text: `Battery: ${battery}`, style: 'meta', alignment: 'right' },
          { text: `Tanggal Asesmen: ${fmtDate(result.assessment_date)}`, style: 'meta', alignment: 'right' },
        ],
      ],
      margin: [0, 0, 0, 16],
    },
  ];

  if (sections.length === 0) {
    content.push({ text: 'Belum ada jawaban yang tercatat untuk asesmen ini.', style: 'bodyMuted' });
  } else {
    for (const section of sections) {
      content.push({ text: section.subtest_name, style: 'sectionHeader' });
      for (const row of section.rows) content.push(...questionBlock(row));
    }
  }

  const docDefinition = {
    pageMargins: [40, 60, 40, 60],
    defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.3 },
    content,
    styles: {
      title: { fontSize: 16, bold: true, margin: [0, 0, 0, 16] },
      meta: { fontSize: 9, color: '#444444' },
      sectionHeader: { fontSize: 12, bold: true, color: '#0A6E5C', margin: [0, 12, 0, 6] },
      qNum: { fontSize: 10, bold: true, color: '#444444' },
      qText: { fontSize: 10, color: '#1A1A1A' },
      aLabel: { fontSize: 9, color: '#6E6A5E' },
      aValue: { fontSize: 9, bold: true, color: '#1A1A1A' },
      correct: { fontSize: 9, bold: true, color: '#22C55E' },
      incorrect: { fontSize: 9, bold: true, color: '#EF4444' },
      bodyMuted: { fontSize: 10, color: '#9C9684', italics: true },
    },
  };

  const printer = new PdfPrinter(fonts);
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  return new Promise((resolve, reject) => {
    const chunks = [];
    pdfDoc.on('data', (chunk) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}
