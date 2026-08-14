import multer from 'multer';
import path from 'path';
import fs from 'fs';
import OfferModel from '../../modules/offer/offer.model.js';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '') || 'unknown';
}

const MB = 1024 * 1024;
const MAX_SIZE = 10 * MB;

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXTS = ['.pdf', '.docx'];

const OFFER_CONTRACT_ROOT = process.env.OFFER_CONTRACT_ROOT
  || path.join(process.cwd(), 'offer_contract');

const fileFilter = async (req, file, cb) => {
  try {
    const { token } = req.params;

    if (!req._offerSend) {
      req._offerSend = await OfferModel.getOfferSendByToken(token);
    }
    if (!req._offerSend) {
      return cb(new Error('Invalid or expired link'), false);
    }
    if (req._offerSend.revoked_at) {
      return cb(new Error('This link has been revoked'), false);
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXTS.includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, DOCX, and TXT files are allowed'), false);
  } catch (err) {
    cb(err, false);
  }
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const { token } = req.params;
      const send = req._offerSend || await OfferModel.getOfferSendByToken(token);
      if (!send) return cb(new Error('Invalid or expired link'), null);
      req._offerSend = send;

      const candidateSlug = slugify(send.candidate_name);
      const folderPath = path.join(
        OFFER_CONTRACT_ROOT, 'candidate_signed', `${candidateSlug}_${send.offer_id}`
      );
      fs.mkdirSync(folderPath, { recursive: true });
      cb(null, folderPath);
    } catch (err) {
      cb(err, null);
    }
  },

  filename: (req, file, cb) => {
    const send = req._offerSend || {};
    const candidateSlug = slugify(send.candidate_name);
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();

    cb(null, `signed_offer_${candidateSlug}_${send.offer_id}_${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE, files: 1 },
});

export default upload;