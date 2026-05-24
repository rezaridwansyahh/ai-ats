// Insights Discovery scoring — ported from the reference prototype's computeProfile().
// answers: array length 72, each 'A' | 'B' | null.
import { PAIRS, PROFILES } from '../data/insights';

export function fmtDateID(d = new Date()) {
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Score the 72 forced-choice answers into dimension counts, percentages,
 * 4 color-quadrant scores, the dominant profile, and a 1–10 clarity composite.
 */
export function computeProfile(answers) {
  let E = 0, I = 0, T = 0, F = 0, S = 0, N = 0;
  answers.forEach((ans, i) => {
    if (ans == null) return;
    const p = PAIRS[i];
    const dim = ans === 'A' ? p.sa : p.sb;
    if (dim === 'E') E++; else if (dim === 'I') I++;
    else if (dim === 'T') T++; else if (dim === 'F') F++;
    else if (dim === 'S') S++; else if (dim === 'N') N++;
  });

  // Normalize to percent (max 24 per scale).
  const Epct = Math.round((E / 24) * 100), Ipct = 100 - Epct;
  const Tpct = Math.round((T / 24) * 100), Fpct = 100 - Tpct;
  const Spct = Math.round((S / 24) * 100), Npct = 100 - Spct;

  // 4 quadrant color scores (0–100).
  const RED = Math.round((Epct + Tpct) / 2);
  const YEL = Math.round((Epct + Fpct) / 2);
  const GRN = Math.round((Ipct + Fpct) / 2);
  const BLU = Math.round((Ipct + Tpct) / 2);

  const quad = { RED, YEL, GRN, BLU };
  const dominantColor = Object.entries(quad).sort((a, b) => b[1] - a[1])[0][0];

  // S/N secondary variant → full profile id.
  const variant = Spct >= 50 ? 'S' : 'N';
  const profileId = dominantColor + '_' + variant;

  // Composite 1–10 = clarity of dominant profile (how concentrated the score is).
  const dominantScore = quad[dominantColor];
  const composite = Math.max(1, Math.min(10, Math.round(((dominantScore - 40) / (65 - 40)) * 9 + 1)));
  const verdictV = composite >= 7 ? 'pass' : composite >= 5 ? 'warn' : 'fail';

  return {
    E, I, T, F, S, N,
    Epct, Ipct, Tpct, Fpct, Spct, Npct,
    RED, YEL, GRN, BLU,
    dominantColor, variant, profileId,
    composite, verdictV,
  };
}

export function getProfile(profileId) {
  return PROFILES[profileId] || null;
}

// Clarity verdict styling, aligned with the assessment-a verdict palette.
export function getClarity(composite) {
  if (composite >= 7) return { v: 'pass', label: 'Profil Jelas & Konsisten', emoji: '✅', color: '#15803D', bg: '#F0FDF4', br: '#16A34A' };
  if (composite >= 5) return { v: 'warn', label: 'Profil Campuran', emoji: '⚡', color: '#92400E', bg: '#FFFBEB', br: '#D97706' };
  return { v: 'fail', label: 'Profil Beragam / Fleksibel', emoji: '🔄', color: '#475569', bg: '#F8FAFC', br: '#94A3B8' };
}
