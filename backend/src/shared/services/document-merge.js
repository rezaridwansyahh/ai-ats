import fs from 'fs';
import JSZip from 'jszip';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export function flattenMergeFields(xml) {
  const runRegex = /<w:r\b[^>]*>[\s\S]*?<\/w:r>/g;
  const runs = [];
  let m;
  while ((m = runRegex.exec(xml)) !== null) {
    runs.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
  }

  let depth = 0;
  let fieldStart = null;
  let instrParts = [];
  const replacements = [];

  for (const run of runs) {
    const isBegin = /<w:fldChar\b[^>]*w:fldCharType="begin"/.test(run.text);
    const isEnd = /<w:fldChar\b[^>]*w:fldCharType="end"/.test(run.text);
    const instrMatch = run.text.match(/<w:instrText\b[^>]*>([\s\S]*?)<\/w:instrText>/);

    if (isBegin) {
      if (depth === 0) { fieldStart = run.start; instrParts = []; }
      depth++;
    }
    if (instrMatch && depth > 0) instrParts.push(instrMatch[1]);
    if (isEnd) {
      depth--;
      if (depth === 0 && fieldStart != null) {
        const instr = instrParts.join('').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        const mergeMatch = instr.match(/MERGEFIELD\s+([^\\]+?)\s*(\\|$)/i);
        if (mergeMatch) {
          const fieldName = mergeMatch[1].trim();
          replacements.push({
            start: fieldStart,
            end: run.end,
            replacementXml: `<w:r><w:t xml:space="preserve">&lt;&lt;${fieldName}&gt;&gt;</w:t></w:r>`,
          });
        }
        fieldStart = null;
      }
    }
  }

  let result = xml;
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { start, end, replacementXml } = replacements[i];
    result = result.slice(0, start) + replacementXml + result.slice(end);
  }
  return result;
}

const ILLEGAL_XML_CHARS = /[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD]/g;
function sanitizeXml(xml) {
  return xml.replace(ILLEGAL_XML_CHARS, '');
}

function sanitizeValue(value) {
  return String(value ?? '').replace(ILLEGAL_XML_CHARS, '');
}

function sanitizeFieldValues(fieldValues) {
  const clean = {};
  for (const [key, value] of Object.entries(fieldValues)) {
    clean[key] = sanitizeValue(value);
  }
  return clean;
}

function reorderZipEntries(buffer) {
  const zip = new PizZip(buffer);
  const fixed = new PizZip();
  fixed.file('[Content_Types].xml', zip.file('[Content_Types].xml').asUint8Array());
  for (const name of Object.keys(zip.files)) {
    if (name === '[Content_Types].xml' || zip.files[name].dir) continue;
    fixed.file(name, zip.file(name).asUint8Array());
  }
  return fixed.generate({ type: 'nodebuffer' });
}

export async function mergeOfferLetter({ templatePath, fieldValues }) {
  const originalBuffer = fs.readFileSync(templatePath);

  const zipForFlatten = await JSZip.loadAsync(originalBuffer);
  const documentXml = await zipForFlatten.file('word/document.xml').async('string');
  const flattenedXml = flattenMergeFields(documentXml);
  const cleanedXml = sanitizeXml(flattenedXml); 
  zipForFlatten.file('word/document.xml', cleanedXml);
  const flattenedBuffer = await zipForFlatten.generateAsync({ type: 'nodebuffer' });

  const zip = new PizZip(flattenedBuffer);
  const doc = new Docxtemplater(zip, {
    delimiters: { start: '<<', end: '>>' },
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render(sanitizeFieldValues(fieldValues));

  const mergedBuffer = doc.getZip().generate({ type: 'nodebuffer' });
  return reorderZipEntries(mergedBuffer);
}