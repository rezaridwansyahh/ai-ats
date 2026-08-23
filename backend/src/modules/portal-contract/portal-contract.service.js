import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import mammoth from 'mammoth';
import PortalContractModel from './portal-contract.model.js';
import OfferModel from '../offer/offer.model.js';
import { convertHtmlToPdf } from '../../shared/services/document-merge.js';
import { toRelativePath, toAbsolutePath } from '../../shared/middleware/offer-send.middleware.js';

const JWT_SECRET = process.env.JWT_SECRET;

function isExpired(row) {
  return !!row.token_expires_at && new Date(row.token_expires_at) < new Date();
}

function isTokenFormat(s) {
  if (typeof s !== 'string') return false;
  return /^[0-9a-fA-F]{32}$/.test(s) || /^[0-9a-fA-F-]{36}$/.test(s);
}

function validateRow(row) {
  if (!row) throw { status: 404, message: 'Invalid contract link.' };
  if (row.status === 'revoked') throw { status: 410, message: 'This contract link has been revoked.' };
  if (row.status === 'submitted') throw { status: 409, message: 'This contract has already been submitted.' };
  if (row.status === 'draft') throw { status: 403, message: 'This contract link has not been sent yet.' };
  if (isExpired(row)) throw { status: 410, message: 'This contract link has expired.' };
}

class PortalContractService {

  async getByToken(token) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid contract link.' };

    const row = await PortalContractModel.getByToken(token);
    validateRow(row);

    return {
      job_title:        row.job_title,
      company_name:     row.company_name,
      status:           row.status,
      token_expires_at: row.token_expires_at,
    };
  }

  async verifyEmail(token, email) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid contract link.' };
    if (!email || !email.trim()) throw { status: 400, message: 'Email is required.' };

    const row = await PortalContractModel.getByToken(token);
    validateRow(row);

    const submitted = email.trim().toLowerCase();
    const expected  = (row.candidate_email || '').toLowerCase();

    if (submitted !== expected) {
      throw { status: 403, message: 'Email does not match our records for this contract link.' };
    }
    const contractToken = jwt.sign(
      { scope: 'contract_send', offer_send_id: row.id },
      JWT_SECRET,
      { expiresIn: '48h' }
    );

    return {
      contract_token: contractToken,
      contract: this._present(row),
    };
  }

  async getContract(token, offer_send_id) {
    const row = await this._loadAuthorized(token, offer_send_id);
    return this._present(row);
  }

  async getDownloadInfo(token, offer_send_id, format = null) {
    const row = await this._loadAuthorized(token, offer_send_id);
    if (!row.letter_file) {
      throw { status: 400, message: 'No finalized contract letter is available yet — contact your recruiter.' };
    }

    const absoluteLetterPath = toAbsolutePath(row.letter_file);
    const nativeExt    = path.extname(row.letter_file).replace('.', '').toLowerCase();
    const requestedExt = (format || nativeExt).toLowerCase();
    const safeName     = (row.candidate_name || 'candidate').trim().replace(/\s+/g, '_');

    if (requestedExt === nativeExt) {
      return {
        kind: 'file',
        filePath: absoluteLetterPath,
        fileName: `Contract_${safeName}.${nativeExt}`,
      };
    }

    if (nativeExt === 'docx' && requestedExt === 'pdf') {
      const docxBuffer = await fs.promises.readFile(absoluteLetterPath);
      const { value: html } = await mammoth.convertToHtml({ buffer: docxBuffer });
      const pdfBuffer = await convertHtmlToPdf(html);
      return {
        kind: 'buffer',
        buffer: pdfBuffer,
        fileName: `Contract_${safeName}.pdf`,
        contentType: 'application/pdf',
      };
    }

    throw {
      status: 400,
      message: `This letter was uploaded as .${nativeExt} — a .${requestedExt} version isn't available.`,
    };
  }

  async uploadCandidateFile(token, offer_send_id, file) {
    if (!file) throw { status: 400, message: 'No file received.' };

    const row = await this._loadAuthorized(token, offer_send_id);
    const relativePath = toRelativePath(file.path);

    if (row.candidate_file && row.candidate_file !== relativePath) {
      const oldAbsolute = toAbsolutePath(row.candidate_file);
      fs.unlink(oldAbsolute, (err) => {
        if (err) console.error('Failed to remove previous candidate upload:', err);
      });
    }

    const updated = await PortalContractModel.setCandidateFile(row.id, relativePath);
    return {
      candidate_file:        updated.candidate_file,
      candidate_uploaded_at: updated.candidate_uploaded_at,
    };
  }

  async submit(token, offer_send_id) {
    const row = await this._loadAuthorized(token, offer_send_id);

    if (!row.candidate_file) {
      throw { status: 400, message: 'Upload your signed contract before submitting.' };
    }

    const updated = await PortalContractModel.markSubmitted(row.id);
    await OfferModel.updateOfferContractStatus(row.offer_id, 'signed');

    return { submitted_at: updated.submitted_at };
  }

  async _loadAuthorized(token, offer_send_id) {
    if (!isTokenFormat(token)) throw { status: 404, message: 'Invalid contract link.' };

    const row = await PortalContractModel.getByToken(token);
    validateRow(row);

    if (row.id !== offer_send_id) {
      throw { status: 403, message: 'Token mismatch.' };
    }
    return row;
  }

  _present(row) {
    const nativeExt = row.letter_file ? path.extname(row.letter_file).replace('.', '').toLowerCase() : null;

    const availableFormats = !nativeExt ? [] : nativeExt === 'docx' ? ['docx', 'pdf'] : [nativeExt];

    return {
      job_title:                row.job_title,
      company_name:             row.company_name,
      candidate_name:           row.candidate_name,
      position_title:           row.position_title,
      contract_type:            row.contract_type,
      contract_status:          row.contract_status,
      status:                   row.status,
      sent_at:                  row.sent_at,
      token_expires_at:         row.token_expires_at,
      has_letter:               !!row.letter_file,
      letter_extension:         nativeExt,
      letter_available_formats: availableFormats,
      candidate_uploaded_at:    row.candidate_uploaded_at,
      submitted_at:             row.submitted_at,
    };
  }
}

export default new PortalContractService();