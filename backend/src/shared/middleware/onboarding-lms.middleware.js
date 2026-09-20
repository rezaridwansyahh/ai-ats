import multer from 'multer';
import path from 'path';
import fs from 'fs';
import OnboardingLmsModel from '../../modules/onboarding-lms/onboarding-lms.model.js';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '') || 'unknown';
}

const MB = 1024 * 1024;
const MAX_SIZE = 500 * MB;

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'video/mp4',
  'video/quicktime', // .mov
  'video/webm',
];
const ALLOWED_EXTS = ['.pdf', '.docx', '.mp4', '.mov', '.webm'];

const LMS_CONTENT_ROOT = process.env.LMS_CONTENT_ROOT
  || path.join(process.cwd(), 'lms_content');


function contentTypeForExt(ext) {
  if (ext === '.docx') return 'pdf';
  if (ext === '.pdf') return 'pdf';
  return 'video'; // .mp4 / .mov / .webm
}

const fileFilter = async (req, file, cb) => {
  try {
    const { module_id } = req.params;
    const company_id = req.user?.company_id;

    if (!req._lmsModule) {
      req._lmsModule = await OnboardingLmsModel.getModuleWithCompany(module_id);
    }
    if (!req._lmsModule || req._lmsModule.company_id !== company_id) {
      return cb(new Error('Module not found'), false);
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXTS.includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, DOCX, MP4, MOV, or WEBM files are allowed'), false);
  } catch (err) {
    cb(err, false);
  }
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const { module_id } = req.params;
      const company_id = req.user?.company_id;

      const lmsModule = req._lmsModule || await OnboardingLmsModel.getModuleWithCompany(module_id);
      if (!lmsModule || lmsModule.company_id !== company_id) {
        return cb(new Error('Module not found'), null);
      }
      req._lmsModule = lmsModule;

      const ext = path.extname(file.originalname).toLowerCase();
      const folderPath = path.join(LMS_CONTENT_ROOT, contentTypeForExt(ext));
      fs.mkdirSync(folderPath, { recursive: true });
      cb(null, folderPath);
    } catch (err) {
      cb(err, null);
    }
  },

  filename: (req, file, cb) => {
    const { module_id } = req.params;
    const lmsModule = req._lmsModule || {};
    const titleSlug = slugify(lmsModule.title);
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();

    cb(null, `${titleSlug}_${module_id}_${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE, files: 1 },
});

export function toRelativePath(absolutePath) {
  if (!absolutePath) return absolutePath;
  return path.relative(LMS_CONTENT_ROOT, absolutePath);
}

export function toAbsolutePath(storedPath) {
  if (!storedPath) return storedPath;
  return path.isAbsolute(storedPath) ? storedPath : path.join(LMS_CONTENT_ROOT, storedPath);
}

export { contentTypeForExt };
export default upload;