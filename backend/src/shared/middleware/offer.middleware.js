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

function createOfferUpload(documentType) {
  const fileFilter = async (req, file, cb) => {
    try {
      const { offer_id } = req.params;
      const company_id = req.user?.company_id;

      if (!req._offer) {
        req._offer = await OfferModel.getOfferById(offer_id, company_id);
      }
      if (!req._offer) {
        return cb(new Error('Offer not found'), false);
      }

      const ext = path.extname(file.originalname).toLowerCase();
      if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXTS.includes(ext)) {
        return cb(null, true);
      }
      cb(new Error('Only PDF and DOCX files are allowed'), false);
    } catch (err) {
      cb(err, false);
    }
  };

  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const { offer_id } = req.params;
        const company_id = req.user?.company_id;

        const offer = req._offer || await OfferModel.getOfferById(offer_id, company_id);
        if (!offer) {
          return cb(new Error('Offer not found'), null);
        }
        req._offer = offer;

        const folderPath = path.join(OFFER_CONTRACT_ROOT, documentType);
        fs.mkdirSync(folderPath, { recursive: true });
        cb(null, folderPath);
      } catch (err) {
        cb(err, null);
      }
    },

    filename: (req, file, cb) => {
      const { offer_id } = req.params;
      const offer = req._offer || {};
      const jobSlug       = slugify(offer.job_title);
      const candidateSlug = slugify(offer.candidate_name);
      const ext       = path.extname(file.originalname).toLowerCase();
      const timestamp = Date.now();

      cb(null, `${documentType}_${candidateSlug}_${jobSlug}_${offer_id}_${timestamp}${ext}`);
    },
  });

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_SIZE, files: 1 },
  });
}

export function toRelativePath(absolutePath) {
  if (!absolutePath) return absolutePath;
  return path.relative(OFFER_CONTRACT_ROOT, absolutePath);
}

export function toAbsolutePath(storedPath) {
  if (!storedPath) return storedPath;
  return path.isAbsolute(storedPath) ? storedPath : path.join(OFFER_CONTRACT_ROOT, storedPath);
}

const upload = createOfferUpload('offer');

export { createOfferUpload };
export default upload;