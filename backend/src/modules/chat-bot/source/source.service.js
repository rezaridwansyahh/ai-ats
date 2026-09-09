import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import SourceModel from './source.model.js';
import WeaviateService from '../../../shared/services/weavite.service.js';

const CHUNK_SIZE = 500;

function chunkText(text) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  for (let i = 0; i < cleaned.length; i += CHUNK_SIZE) {
    chunks.push(cleaned.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

class SourceService {
  async upload({ company_id, uploaded_by, filePath, originalName }) {
    const record = await SourceModel.create({ company_id, file: filePath, uploaded_by });

    try {
      await SourceModel.updateStatus(record.id, { status: 'processing' });

      const buffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: buffer });
      let parsedText;
      try {
        const result = await parser.getText();
        parsedText = result.text;
      } finally {
        await parser.destroy();
      }

      const chunks = chunkText(parsedText);

      if (chunks.length === 0) {
        throw new Error('No extractable text found in this PDF.');
      }

      await WeaviateService.ensureSchema();
      const sourceKey = `source-${record.id}`;
      await WeaviateService.insertChunks({
        companyId: company_id,
        sourceId: record.id,
        sourceName: originalName,
        chunks,
      });

      return SourceModel.updateStatus(record.id, {
        status: 'indexed',
        chunk_count: chunks.length,
        weaviate_source_key: sourceKey,
        error_message: null,
      });
    } catch (err) {
      await SourceModel.updateStatus(record.id, { status: 'failed', error_message: err.message });
      throw { status: 500, message: `Failed to index document: ${err.message}` };
    }
  }

  async list(company_id) {
    return SourceModel.listByCompany(company_id);
  }

  async remove(id, company_id) {
    const record = await SourceModel.getById(id);
    if (!record) throw { status: 404, message: 'Document not found.' };
    if (record.company_id !== company_id) throw { status: 403, message: 'Access denied.' };

    await WeaviateService.deleteBySourceId(record.id);
    await SourceModel.delete(id);
    return true;
  }
}

export default new SourceService();