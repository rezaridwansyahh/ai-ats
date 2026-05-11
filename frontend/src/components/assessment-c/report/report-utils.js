// Manager-view 3-pillar bridge — Battery C specific.
// Battery C uses EPPS + SJT for personality (blended 1:1) and PAPI leadership cluster
// (L, I, K, F dims) for work-attitude. Cognitive uses the same TK composite scaling as A/B.

export const PILLAR_THRESHOLDS = { cognitive: 70, personality: 65, workAttitude: 70, overall: 70 };

export function calc3Pillar(r) {
  const pillar = { cognitive: null, personality: null, workAttitude: null, overall: null };
  if (!r) return pillar;

  if (r.tk?.composite != null) pillar.cognitive = Math.round(r.tk.composite * 10);

  // Battery C — Personality: blend EPPS consistency (0–15 mapped to ~50–90) with SJT overallPct (0–100),
  // averaged. Either signal alone is acceptable; if both present, take the mean.
  {
    const conS = r.epps?.conScore;
    const sjtPct = r.sjt?.overallPct;
    const eppsScaled = conS != null
      ? Math.min(100, Math.max(0, 70 + (conS / 15 - 0.5) * 40))
      : null;
    const sjtScaled = sjtPct != null ? sjtPct : null;
    const vals = [eppsScaled, sjtScaled].filter((v) => v != null);
    if (vals.length) pillar.personality = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  // Battery C — Work Attitude: PAPI leadership rule.
  // L (Leadership role) ≥ 5 AND I (Independence) ≥ 5 → 90 (active leader profile)
  // K (Anxiety need) ≥ 7 AND F (Support need) ≥ 7 → 50 (high-anxiety, dependent → less fit)
  // otherwise → 70 (neutral)
  if (r.papi?.scores) {
    const { L = 0, I = 0, K = 0, F = 0 } = r.papi.scores;
    if (L >= 5 && I >= 5) pillar.workAttitude = 90;
    else if (K >= 7 && F >= 7) pillar.workAttitude = 50;
    else pillar.workAttitude = 70;
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
    return { kind: 'pass', label: 'Direkomendasikan Kuat', sub: 'Rekruter menilai kandidat sesuai untuk peran Supervisor / Team Lead' };
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
  if (overV === 'pass' && cogV === 'pass') return { kind: 'pass', label: 'Direkomendasikan Kuat', sub: 'Kapasitas kognitif dan profil kandidat mendukung peran Supervisor / Team Lead' };
  return { kind: 'warn', label: 'Perlu Pertimbangan', sub: 'Evaluasi lanjutan disarankan sebelum keputusan final' };
}

export function genManagerSummary(r, verdict, profile) {
  if (!r?.tk) return 'Data asesmen belum tersedia atau belum lengkap.';
  const name = profile?.name || 'Kandidat';
  const pillar = calc3Pillar(r);
  const parts = [];

  if (pillar.cognitive != null) {
    if (pillar.cognitive >= 80) parts.push(`<strong>${name}</strong> menunjukkan kemampuan kognitif yang kuat (skor ${pillar.cognitive}/100) — siap menguasai materi peran dengan cepat.`);
    else if (pillar.cognitive >= 70) parts.push(`<strong>${name}</strong> memiliki kemampuan kognitif yang memadai (skor ${pillar.cognitive}/100) untuk tuntutan peran supervisori.`);
    else if (pillar.cognitive >= 55) parts.push(`<strong>${name}</strong> memiliki kemampuan kognitif di zona menengah (skor ${pillar.cognitive}/100) — perlu pendampingan ekstra saat onboarding.`);
    else parts.push(`<strong>${name}</strong> menunjukkan kemampuan kognitif yang belum memadai (skor ${pillar.cognitive}/100) untuk tuntutan peran supervisori.`);
  }
  if (pillar.personality != null) {
    if (pillar.personality >= 75) parts.push('Profil kepribadian dan penilaian situasionalnya <strong>mendukung kuat</strong> karakter peran yang diharapkan.');
    else if (pillar.personality >= 65) parts.push('Profil kepribadian dan penilaian situasionalnya <strong>cukup sesuai</strong> dengan karakter peran.');
    else if (pillar.personality >= 50) parts.push('Profil kepribadian dan penilaian situasionalnya menunjukkan <strong>kombinasi campuran</strong> — ada area yang sesuai dan ada yang perlu dievaluasi.');
    else parts.push('Profil kepribadian dan penilaian situasionalnya menunjukkan <strong>risiko ketidakcocokan</strong> dengan karakter peran supervisori.');
  }
  if (pillar.workAttitude != null) {
    if (pillar.workAttitude >= 75) parts.push('Sikap kerjanya <strong>selaras</strong> dengan budaya dan tuntutan posisi kepemimpinan.');
    else if (pillar.workAttitude < 55) parts.push('Sikap kerjanya menunjukkan <strong>orientasi yang kurang selaras</strong> dengan tuntutan kepemimpinan.');
  }
  if (verdict.kind === 'pass') parts.push('Berdasarkan data ini, kandidat <strong>layak dilanjutkan</strong> ke tahap berikutnya.');
  else if (verdict.kind === 'warn') parts.push('Berdasarkan data ini, kandidat dapat dipertimbangkan dengan <strong>evaluasi tambahan</strong>.');
  else if (verdict.kind === 'fail') parts.push('Berdasarkan data ini, kandidat <strong>kurang sesuai</strong> untuk peran ini.');

  return parts.join(' ');
}
