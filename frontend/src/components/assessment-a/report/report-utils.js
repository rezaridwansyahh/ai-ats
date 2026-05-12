// Manager-view 3-pillar bridge — Battery A specific.
// Battery A uses Big Five (instead of EPPS) and DISC (instead of PAPI), so the
// personality and work-attitude formulas differ from Battery B. Cognitive uses the
// same TK composite scaling.

export const PILLAR_THRESHOLDS = { cognitive: 70, personality: 65, workAttitude: 70, overall: 70 };

export function calc3Pillar(r) {
  const pillar = { cognitive: null, personality: null, workAttitude: null, overall: null };
  if (!r) return pillar;

  if (r.tk?.composite != null) pillar.cognitive = Math.round(r.tk.composite * 10);

  // Battery A — Big Five: weight Conscientiousness × 0.4 + (100 − Neuroticism) × 0.3 + Agreeableness × 0.3.
  // Favors high C, low N, high A — the personality profile most predictive of operational-role fit.
  if (r.bigfive?.pct) {
    const { C = 0, N = 0, A = 0 } = r.bigfive.pct;
    pillar.personality = Math.round(Math.max(0, Math.min(100, C * 0.4 + (100 - N) * 0.3 + A * 0.3)));
  }

  // Battery A — DISC fit × 0.5 + Holland fit × 0.5.
  // DISC: S (Steadiness) → 100, C (Compliance) → 85, D/I → 55 (less aligned with stable operational work).
  // Holland: C or S in code3 → 95, R → 80, others → 55.
  if (r.disc || r.holland) {
    let discFit = 60;
    let holFit = 60;
    if (r.disc?.dominant) {
      const d = r.disc.dominant;
      if (d === 'S') discFit = 100;
      else if (d === 'C') discFit = 85;
      else discFit = 55; // D or I
    }
    if (r.holland?.code3) {
      const code = r.holland.code3;
      if (code.includes('C') || code.includes('S')) holFit = 95;
      else if (code.includes('R')) holFit = 80;
      else holFit = 55;
    }
    pillar.workAttitude = Math.round(discFit * 0.5 + holFit * 0.5);
  }

  const vals = [pillar.cognitive, pillar.personality, pillar.workAttitude].filter((v) => v != null);
  if (vals.length > 0) pillar.overall = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);

  return pillar;
}

export function pillarVerdict(score, threshold) {
  if (score == null) return 'empty';
  if (score >= threshold) return 'pass';
  if (score >= threshold - 15) return 'warn';
  return 'fail';
}

export function deriveOverallVerdict(r, finalRec) {
  const pillar = calc3Pillar(r);
  if (pillar.overall == null) return { kind: 'empty', label: 'Belum Tersedia', sub: 'Kandidat belum menyelesaikan asesmen' };

  if (finalRec === 'direkomendasikan' || finalRec === 'kuat') {
    return { kind: 'pass', label: 'Direkomendasikan Kuat', sub: 'Rekruter menilai kandidat sesuai untuk peran Operasional / Staf Umum' };
  }
  if (finalRec === 'evaluasi' || finalRec === 'pertimbangkan') {
    return { kind: 'warn', label: 'Perlu Pertimbangan', sub: 'Rekruter menilai kandidat perlu evaluasi lebih lanjut' };
  }
  if (finalRec === 'tidak') {
    return { kind: 'fail', label: 'Tidak Direkomendasikan', sub: 'Rekruter menilai kandidat belum sesuai untuk peran ini' };
  }

  const cogV = pillarVerdict(pillar.cognitive, PILLAR_THRESHOLDS.cognitive);
  const perV = pillarVerdict(pillar.personality, PILLAR_THRESHOLDS.personality);
  const waV = pillarVerdict(pillar.workAttitude, PILLAR_THRESHOLDS.workAttitude);
  const overV = pillarVerdict(pillar.overall, PILLAR_THRESHOLDS.overall);

  if (cogV === 'fail') return { kind: 'fail', label: 'Tidak Direkomendasikan', sub: 'Kapasitas kognitif belum mencukupi persyaratan minimum peran' };
  const fails = [cogV, perV, waV].filter((v) => v === 'fail').length;
  const warns = [cogV, perV, waV].filter((v) => v === 'warn').length;
  if (fails >= 2) return { kind: 'fail', label: 'Tidak Direkomendasikan', sub: 'Beberapa dimensi inti tidak memenuhi tuntutan peran' };
  if (fails >= 1) return { kind: 'warn', label: 'Perlu Pertimbangan', sub: 'Ada dimensi penting yang belum memadai — perlu evaluasi lanjutan' };
  if (warns >= 2) return { kind: 'warn', label: 'Perlu Pertimbangan', sub: 'Skor berada di zona menengah pada beberapa dimensi' };
  if (overV === 'pass' && cogV === 'pass') return { kind: 'pass', label: 'Direkomendasikan Kuat', sub: 'Kapasitas kognitif dan profil kandidat mendukung peran Operasional / Staf Umum' };
  return { kind: 'warn', label: 'Perlu Pertimbangan', sub: 'Evaluasi lanjutan disarankan sebelum keputusan final' };
}

export function genManagerSummary(r, verdict, profile) {
  if (!r?.tk) return 'Data asesmen belum tersedia atau belum lengkap.';
  const name = profile?.name || 'Kandidat';
  const pillar = calc3Pillar(r);
  const parts = [];

  if (pillar.cognitive != null) {
    if (pillar.cognitive >= 80) parts.push(`<strong>${name}</strong> menunjukkan kemampuan kognitif yang kuat (skor ${pillar.cognitive}/100) — siap menguasai materi peran dengan cepat.`);
    else if (pillar.cognitive >= 70) parts.push(`<strong>${name}</strong> memiliki kemampuan kognitif yang memadai (skor ${pillar.cognitive}/100) untuk tuntutan peran.`);
    else if (pillar.cognitive >= 55) parts.push(`<strong>${name}</strong> memiliki kemampuan kognitif di zona menengah (skor ${pillar.cognitive}/100) — perlu pendampingan ekstra saat onboarding.`);
    else parts.push(`<strong>${name}</strong> menunjukkan kemampuan kognitif yang belum memadai (skor ${pillar.cognitive}/100) untuk tuntutan peran.`);
  }
  if (pillar.personality != null) {
    if (pillar.personality >= 75) parts.push('Profil kepribadiannya <strong>mendukung kuat</strong> karakter peran yang diharapkan.');
    else if (pillar.personality >= 65) parts.push('Profil kepribadiannya <strong>cukup sesuai</strong> dengan karakter peran.');
    else if (pillar.personality >= 50) parts.push('Profil kepribadiannya menunjukkan <strong>kombinasi campuran</strong> — ada area yang sesuai dan ada yang perlu dievaluasi.');
    else parts.push('Profil kepribadiannya menunjukkan <strong>risiko ketidakcocokan</strong> dengan karakter peran.');
  }
  if (pillar.workAttitude != null) {
    if (pillar.workAttitude >= 75) parts.push('Sikap kerjanya <strong>selaras</strong> dengan budaya dan tuntutan posisi.');
    else if (pillar.workAttitude < 55) parts.push('Sikap kerjanya menunjukkan <strong>orientasi yang kurang selaras</strong> dengan tuntutan posisi.');
  }
  if (verdict.kind === 'pass') parts.push('Berdasarkan data ini, kandidat <strong>layak dilanjutkan</strong> ke tahap berikutnya.');
  else if (verdict.kind === 'warn') parts.push('Berdasarkan data ini, kandidat dapat dipertimbangkan dengan <strong>evaluasi tambahan</strong>.');
  else if (verdict.kind === 'fail') parts.push('Berdasarkan data ini, kandidat <strong>kurang sesuai</strong> untuk peran ini.');

  return parts.join(' ');
}
