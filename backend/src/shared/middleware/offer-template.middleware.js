import multer from 'multer';
import path from 'path';
import fs from 'fs';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '') || 'company';
}

const ALLOWED_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const ALLOWED_EXT = '.docx';

// No hardcoded path — set OFFER_TEMPLATE_ROOT in the environment on the VPS.
const OFFER_TEMPLATE_ROOT = process.env.OFFER_TEMPLATE_ROOT
  || path.join(process.cwd(), 'offer_letter_templates');

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === ALLOWED_MIME && ext === ALLOWED_EXT) {
    return cb(null, true);
  }
  cb(new Error('Only .docx files are allowed'), false);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const company_id = req.user?.company_id;
      if (!company_id) {
        return cb(new Error('company_id is required for upload path'), null);
      }
      const folderPath = path.join(OFFER_TEMPLATE_ROOT, slugify(`company_${company_id}`));
      fs.mkdirSync(folderPath, { recursive: true });
      cb(null, folderPath);
    } catch (err) {
      cb(err, null);
    }
  },

  filename: (req, file, cb) => {
    const company_id = req.user?.company_id || 'unknown';
    const timestamp = Date.now();
    cb(null, `offer_letter_template_${company_id}_${timestamp}.docx`);
  },
});

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

export default upload;