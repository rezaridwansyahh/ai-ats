import fs from 'fs';
import JSZip from 'jszip';
import OfferTemplateModel from './offer-template.model.js';

async function extractFields(filePath) {
  const buffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file('word/document.xml')?.async('string');

  if (!documentXml) {
    throw { status: 400, message: 'Could not read document.xml from the uploaded .docx file' };
  }

  const mergeFieldMatches = [...documentXml.matchAll(/MERGEFIELD\s+([^\s"<\\]+)/g)];
  const mergeFields = mergeFieldMatches.map((m) => m[1].trim());

  const textOnly = documentXml
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  const literalMatches = [...textOnly.matchAll(/<<\s*([^<>]+?)\s*>>/g)];
  const literalFields = literalMatches.map((m) => m[1].trim());

  const fields = [...new Set([...mergeFields, ...literalFields])];

  return fields;
}

class OfferTemplateService {
  async getTemplate(company_id) {
    return OfferTemplateModel.getByCompanyId(company_id);
  }

  async uploadTemplate(company_id, user_id, file) {
    if (!file) {
      throw { status: 400, message: 'No file received' };
    }

    let fields;
    try {
      fields = await extractFields(file.path);
    } catch (err) {
      fs.unlink(file.path, () => {});
      throw err.status ? err : { status: 400, message: 'Failed to read the uploaded template' };
    }

    if (fields.length === 0) {
      fs.unlink(file.path, () => {});
      throw { status: 400, message: 'No <<field>> placeholders were found in this template' };
    }

    const existing = await OfferTemplateModel.getByCompanyId(company_id);
    if (existing?.file && existing.file !== file.path) {
      fs.unlink(existing.file, (err) => {
        if (err) console.error('Failed to remove previous offer letter template:', err);
      });
    }

    const template = await OfferTemplateModel.upsert({
      company_id,
      file: file.path,
      fields,
      uploaded_by: user_id,
    });

    return { template, message: 'Offer letter template uploaded' };
  }
}

export default new OfferTemplateService();