import multer from 'multer';
import path from 'path';

const MB = 1024 * 1024;
const ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * MB, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTS.includes(ext)) return cb(null, true);
    cb(new Error('Only PDF, JPG and PNG files are allowed'), false);
  },
}).single('file');

export const uploadDocument = (req, res, next) =>
  upload(req, res, (err) => (err ? res.status(400).json({ message: err.message }) : next()));