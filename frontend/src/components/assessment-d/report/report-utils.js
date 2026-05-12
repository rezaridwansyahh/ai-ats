// Manager-view 3-pillar bridge — Battery D specific.
// Battery D uses 16PF executive-cluster for personality (high C, Q3, E, H; low Q4, O),
// and MSDT effectiveness × PAPI-L leadership for work-attitude.
// Cognitive uses the same TK composite scaling as A/B/C.

export const PILLAR_THRESHOLDS = { cognitive: 70, personality: 65, workAttitude: 70, overall: 70 };

export function calc3Pillar(r) {
  const pillar = { cognitive: null, personality: null, workAttitude: null, overall: null };
  if (!r) return pillar;

  if (r.tk?.composite != null) pillar.cognitive = Math.round(r.tk.composite * 10);

  // Battery D — Personality: executive 16PF cluster
  //   high C (stability) + Q3 (self-discipline) + low Q4 (low tension, inverted) × 10
  //   high E (dominance) + H (social boldness) + low O (low apprehension, inverted) × 6
  //   normalized by sum of weights (10+10+10+6+6+6 = 48) → /4.8 to give a 0–100 range.
  if (r.pf?.std) {
    const s = r.pf.std;
    const C = s.C ?? 5, Q3 = s.Q3 ?? 5, Q4 = s.Q4 ?? 5;
    const E = s.E ?? 5, H = s.H ?? 5, O = s.O ?? 5;
    const exec = (C * 10 + Q3 * 10 + (11 - Q4) * 10 + E * 6 + H * 6 + (11 - O) * 6) / 4.8;
    pillar.personality = Math.round(Math.max(0, Math.min(100, exec)));
  }

  // Battery D — Work Attitude: MSDT effectivePct × 0.5 + PAPI-L leadership × 0.5
  if (r.msdt || r.papil) {
    const msdtFit = r.msdt?.effectPct != null ? Math.min(100, r.msdt.effectPct) : 60;
    let papilFit = 60;
    if (r.papil?.scores) {
      const { L = 0, I = 0, K = 0, F = 0 } = r.papil.scores;
      if (L >= 5 && I >= 5) papilFit = 90;
      else if (K >= 6 && F >= 6) papilFit = 50;
      else papilFit = 70;
    }
    pillar.workAttitude = Math.round(msdtFit * 0.5 + papilFit * 0.5);
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
    return { kind: 'pass', label: 'Direkomendasikan Kuat', sub: 'Rekruter menilai kandidat sesuai untuk peran Senior Leadership / Eksekutif' };
  }
  if (finalRec === 'evaluasi' || finalRec === 'pertimbangkan') {
    return { kind: 'warn', label: 'Perlu Pertimbangan', sub: 'Rekruter menilai kandidat perlu evaluasi lebih lanjut' };
  }
  if (finalRec === 'tidak') {
    return { kind: 'fail', label: 'Tidak Direkomendasikan', sub: 'Rekruter menilai kandidat belum sesuai untuk peran ini' };
  }

  const cogV = pillarVerdict(pillar.cognitive, PILLAR_THRESHOLDS.cognitive);
  const perV = pillarVerdict(pillar.personality, PILLAR_THRESHOLDS.personality);
  const waV  = pillarVerdict(pillar.workAttitude, PILLAR_THRESHOLDS.workAttitude);
  const overV = pillarVerdict(pillar.overall, PILLAR_THRESHOLDS.overall);

  if (cogV === 'fail') return { kind: 'fail', label: 'Tidak Direkomendasikan', sub: 'Kapasitas kognitif belum mencukupi persyaratan minimum peran eksekutif' };
  const fails = [cogV, perV, waV].filter((v) => v === 'fail').length;
  const warns = [cogV, perV, waV].filter((v) => v === 'warn').length;
  if (fails >= 2) return { kind: 'fail', label: 'Tidak Direkomendasikan', sub: 'Beberapa dimensi inti tidak memenuhi tuntutan peran senior leadership' };
  if (fails >= 1) return { kind: 'warn', label: 'Perlu Pertimbangan', sub: 'Ada dimensi penting yang belum memadai — perlu evaluasi lanjutan' };
  if (warns >= 2) return { kind: 'warn', label: 'Perlu Pertimbangan', sub: 'Skor berada di zona menengah pada beberapa dimensi' };
  if (overV === 'pass' && cogV === 'pass') return { kind: 'pass', label: 'Direkomendasikan Kuat', sub: 'Kapasitas kognitif dan profil kandidat mendukung peran Senior Leadership / Eksekutif' };
  return { kind: 'warn', label: 'Perlu Pertimbangan', sub: 'Evaluasi lanjutan disarankan sebelum keputusan final' };
}

export function genManagerSummary(r, verdict, profile) {
  if (!r?.tk) return 'Data asesmen belum tersedia atau belum lengkap.';
  const name = profile?.name || 'Kandidat';
  const pillar = calc3Pillar(r);
  const parts = [];

  if (pillar.cognitive != null) {
    if (pillar.cognitive >= 80) parts.push(`<strong>${name}</strong> menunjukkan kemampuan kognitif yang kuat (skor ${pillar.cognitive}/100) — siap menghadapi kompleksitas strategis peran eksekutif.`);
    else if (pillar.cognitive >= 70) parts.push(`<strong>${name}</strong> memiliki kemampuan kognitif yang memadai (skor ${pillar.cognitive}/100) untuk tuntutan peran senior leadership.`);
    else if (pillar.cognitive >= 55) parts.push(`<strong>${name}</strong> memiliki kemampuan kognitif di zona menengah (skor ${pillar.cognitive}/100) — perlu pendampingan ekstra dalam pengambilan keputusan strategis.`);
    else parts.push(`<strong>${name}</strong> menunjukkan kemampuan kognitif yang belum memadai (skor ${pillar.cognitive}/100) untuk tuntutan peran eksekutif.`);
  }
  if (pillar.personality != null) {
    if (pillar.personality >= 75) parts.push('Profil kepribadian eksekutifnya <strong>mendukung kuat</strong> karakter kepemimpinan senior yang diharapkan.');
    else if (pillar.personality >= 65) parts.push('Profil kepribadian eksekutifnya <strong>cukup sesuai</strong> dengan karakter senior leadership.');
    else if (pillar.personality >= 50) parts.push('Profil kepribadian eksekutifnya menunjukkan <strong>kombinasi campuran</strong> — ada area yang sesuai dan ada yang perlu dievaluasi.');
    else parts.push('Profil kepribadian eksekutifnya menunjukkan <strong>risiko ketidakcocokan</strong> dengan tuntutan kepemimpinan senior.');
  }
  if (pillar.workAttitude != null) {
    if (pillar.workAttitude >= 75) parts.push('Gaya dan preferensi kepemimpinannya <strong>selaras</strong> dengan tuntutan posisi eksekutif.');
    else if (pillar.workAttitude < 55) parts.push('Gaya dan preferensi kepemimpinannya menunjukkan <strong>orientasi yang kurang selaras</strong> dengan tuntutan eksekutif.');
  }
  if (verdict.kind === 'pass') parts.push('Berdasarkan data ini, kandidat <strong>layak dilanjutkan</strong> ke tahap berikutnya.');
  else if (verdict.kind === 'warn') parts.push('Berdasarkan data ini, kandidat dapat dipertimbangkan dengan <strong>evaluasi tambahan</strong>.');
  else if (verdict.kind === 'fail') parts.push('Berdasarkan data ini, kandidat <strong>kurang sesuai</strong> untuk peran ini.');

  return parts.join(' ');
}
