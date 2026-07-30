import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export function mergeOfferLetter({ templatePath, fieldValues }) {
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    delimiters: { start: '<<', end: '>>' },
    paragraphLoop: true,
    linebreaks: true,
  });
  doc.render(fieldValues);
  return doc.getZip().generate({ type: 'nodebuffer' });
}