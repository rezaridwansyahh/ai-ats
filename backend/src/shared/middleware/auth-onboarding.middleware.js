import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default function requireCandidatePortalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Missing onboarding token.' });

    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.scope !== 'onboarding_candidate') {
      return res.status(403).json({ message: 'Wrong token scope.' });
    }

    req.onboardingId = payload.onboarding_id;
    req.candidateId = payload.candidate_id;
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid or expired onboarding token.' });
  }
}