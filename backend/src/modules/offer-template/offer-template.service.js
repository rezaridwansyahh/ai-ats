import fs from 'fs';
import JSZip from 'jszip';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import OfferTemplateModel from './offer-template.model.js';
import { flattenMergeFields } from '../../shared/services/document-merge.js';
import { toRelativePathTemplate, toAbsolutePathTemplate } from '../../shared/middleware/offer-template.middleware.js';

async function getFlattenedText(filePath) {
  const buffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file('word/document.xml')?.async('string');

  if (!documentXml) {
    throw { status: 400, message: 'Could not read document.xml from the uploaded .docx file' };
  }

  return flattenMergeFields(documentXml);
}

async function extractFields(flattenedXml) {
  const textOnly = flattenedXml
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  const matches = [...textOnly.matchAll(/<<\s*([^<>]+?)\s*>>/g)];
  return [...new Set(matches.map((m) => m[1].trim()))];
}

function validateTemplateSyntax(flattenedXml) {
  const zip = new PizZip();
  zip.file('word/document.xml', flattenedXml);
  zip.file('[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
  );

  try {
    new Docxtemplater(zip, {
      delimiters: { start: '<<', end: '>>' },
      paragraphLoop: true,
      linebreaks: true,
    });
    return null;
  } catch (err) {
    const rawErrors = err.properties?.errors || [err];
    return rawErrors.map((e) => {
      const props = e.properties || {};
      const decode = (s) => s?.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

      return {
        message: decode(props.explanation) || e.message, 
        near: decode(props.context),
      };
    });
  }
}

class OfferTemplateService {
  async getTemplate(company_id) {
    return OfferTemplateModel.getByCompanyId(company_id);
  }
  async uploadTemplate(company_id, user_id, file) {
    if (!file) {
      throw { status: 400, message: 'No file received' };
    }
    let flattenedXml;
    try {
      flattenedXml = await getFlattenedText(file.path);
    } catch (err) {
      fs.unlink(file.path, () => {});
      throw err.status ? err : { status: 400, message: 'Failed to read the uploaded template' };
    }

    const fields = await extractFields(flattenedXml);

    if (fields.length === 0) {
      fs.unlink(file.path, () => {});
      throw { status: 400, message: 'No <<field>> or merge-field placeholders were found in this template' };
    }

    const syntaxErrors = validateTemplateSyntax(flattenedXml);
    if (syntaxErrors) {
      fs.unlink(file.path, () => {});
      const detail = syntaxErrors
        .map((e) => (e.near ? `${e.message} (look for "${e.near}" in your document)` : e.message))
        .join('; ');
      throw {
        status: 400,
        message: `Template has a tag problem: ${detail}. Every placeholder needs matching << and >> — e.g. <<name>>, not <name>> or <<name>.`,
      };
    }

    const relativePath = toRelativePathTemplate(file.path);

    const existing = await OfferTemplateModel.getByCompanyId(company_id);
    if (existing?.file && existing.file !== relativePath) {
      const oldAbsolute = toAbsolutePathTemplate(existing.file);
      fs.unlink(oldAbsolute, (err) => {
        if (err) console.error('Failed to remove previous offer letter template:', err);
      });
    }

    const template = await OfferTemplateModel.upsert({
      company_id,
      file: relativePath,
      fields,
      uploaded_by: user_id,
    });

    return { template, message: 'Offer letter template uploaded' };
  }
}

export default new OfferTemplateService();