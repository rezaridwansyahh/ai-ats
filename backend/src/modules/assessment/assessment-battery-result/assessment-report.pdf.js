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

const FINAL_REC_LABELS = {
  direkomendasikan: 'Direkomendasikan (Advance)',
  evaluasi: 'Evaluasi Lanjutan (Hold)',
  tidak: 'Tidak Direkomendasikan (Reject)',
};

function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
}

function narrativeSection(title, text) {
  return [
    { text: title, style: 'sectionHeader' },
    { text: text?.trim() || 'Belum tersedia.', style: text?.trim() ? 'body' : 'bodyMuted', margin: [0, 0, 0, 12] },
  ];
}

// Builds a simple, formal PDF report (name/battery/recommendation + the same
// narrative synthesis fields shown in the app) — no per-subtest score table,
// since several subtests (EPPS/PAPI/Holland) have no single representative
// number and fabricating one would be misleading in an HR decision document.
export async function buildAssessmentReportPdf(result) {
  const battery = BATTERY_BY_ASSESSMENT_ID[result.assessment_id] || '—';
  const finalRec = result.summary?.assessor?.finalRec;

  const docDefinition = {
    pageMargins: [40, 60, 40, 60],
    defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.3 },
    content: [
      { text: 'LAPORAN HASIL ASESMEN', style: 'title' },
      {
        columns: [
          [
            { text: `Nama: ${result.candidate_name || '—'}`, style: 'meta' },
            { text: `Email: ${result.candidate_email || '—'}`, style: 'meta' },
            { text: `Pendidikan: ${result.candidate_education || '—'}`, style: 'meta' },
          ],
          [
            { text: `Battery: ${battery}`, style: 'meta', alignment: 'right' },
            { text: `Tanggal Asesmen: ${fmtDate(result.assessment_date)}`, style: 'meta', alignment: 'right' },
            { text: `Status: ${result.status || '—'}`, style: 'meta', alignment: 'right' },
          ],
        ],
        margin: [0, 0, 0, 16],
      },
      {
        text: `Rekomendasi: ${FINAL_REC_LABELS[finalRec] || 'Belum ditentukan'}`,
        style: 'recommendation',
        margin: [0, 0, 0, 16],
      },
      ...narrativeSection('Ringkasan', result.narrative_report),
      ...narrativeSection('Kekuatan', result.strengths),
      ...narrativeSection('Area Pengembangan', result.development_areas),
      ...narrativeSection('Rekomendasi Peran', result.recommended_roles),
    ],
    styles: {
      title: { fontSize: 16, bold: true, margin: [0, 0, 0, 16] },
      meta: { fontSize: 9, color: '#444444' },
      recommendation: { fontSize: 12, bold: true, color: '#0A6E5C' },
      sectionHeader: { fontSize: 11, bold: true, margin: [0, 8, 0, 4] },
      body: { fontSize: 10, color: '#1A1A1A' },
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
