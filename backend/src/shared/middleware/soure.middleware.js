import multer from 'multer';
import path from 'path';
import fs from 'fs';

const MB = 1024 * 1024;
const MAX_SIZE = 50 * MB;

const SOURCE_ROOT = process.env.CHATBOT_SOURCE_ROOT
  || path.join(process.cwd(), 'chatbot_sources');

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === 'application/pdf' && ext === '.pdf') {
    return cb(null, true);
  }
  cb(new Error('Only PDF files are allowed'), false);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(SOURCE_ROOT, { recursive: true });
    cb(null, SOURCE_ROOT);
  },
  filename: (req, file, cb) => {
    const companyId = req.user?.company_id ?? 'unknown';
    cb(null, `company${companyId}_${Date.now()}.pdf`);
  },
});

export default multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE, files: 1 } });