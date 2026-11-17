import multer from 'multer';
import path from 'path';

const MB = 1024 * 1024;

function makeUpload(exts, maxMb, message) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxMb * MB, files: 1 },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (exts.includes(ext)) return cb(null, true);
      cb(new Error(message), false);
    },
  }).single('file');
  
  return (req, res, next) => upload(req, res, (err) => (err ? res.status(400).json({ message: err.message }) : next()));
}

export const uploadDocument = makeUpload(['.pdf', '.jpg', '.jpeg', '.png'], 10, 'Only PDF, JPG and PNG files are allowed');
export const uploadSpreadsheet = makeUpload(['.xlsx', '.csv'], 5, 'Only .xlsx and .csv files are allowed');