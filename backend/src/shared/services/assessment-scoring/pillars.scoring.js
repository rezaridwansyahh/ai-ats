// Manager-view 3-pillar bridge — ported verbatim from each battery's
// frontend `report/report-utils.js` (genuinely 4 distinct formulas, one per
// battery, confirmed by direct read of all four). Pure function of the
// already-authoritative `by_subtest` scores — no human/narrative input, so
// safe to fully recompute server-side (unlike `summary.assessor`, which stays
// client/human-authored and untouched).

export const PILLAR_THRESHOLDS = { cognitive: 70, personality: 65, work_attitude: 70, overall: 70 };

function baseCognitive(by_subtest) {
  return by_subtest.tk?.composite != null ? Math.round(by_subtest.tk.composite * 10) : null;
}

function finalizeOverall(pillar) {
  const vals = [pillar.cognitive, pillar.personality, pillar.workAttitude].filter((v) => v != null);
  pillar.overall = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  return pillar;
}

// Battery A — Big Five (personality) + DISC/Holland (work attitude).
function calcPillarsA(by_subtest) {
  const pillar = { cognitive: baseCognitive(by_subtest), personality: null, workAttitude: null, overall: null };

  if (by_subtest.bigfive?.pct) {
    const { C = 0, N = 0, A = 0 } = by_subtest.bigfive.pct;
    pillar.personality = Math.round(Math.max(0, Math.min(100, C * 0.4 + (100 - N) * 0.3 + A * 0.3)));
  }

  if (by_subtest.disc || by_subtest.holland) {
    let discFit = 60;
    let holFit = 60;
    if (by_subtest.disc?.dominant) {
      const d = by_subtest.disc.dominant;
      if (d === 'S') discFit = 100;
      else if (d === 'C') discFit = 85;
      else discFit = 55;
    }
    if (by_subtest.holland?.code3) {
      const code = by_subtest.holland.code3;
      if (code.includes('C') || code.includes('S')) holFit = 95;
      else if (code.includes('R')) holFit = 80;
      else holFit = 55;
    }
    pillar.workAttitude = Math.round(discFit * 0.5 + holFit * 0.5);
  }

  return finalizeOverall(pillar);
}

// Battery B — EPPS (personality) + PAPI/Holland (work attitude).
function calcPillarsB(by_subtest) {
  const pillar = { cognitive: baseCognitive(by_subtest), personality: null, workAttitude: null, overall: null };

  if (by_subtest.epps) {
    const conS = ((by_subtest.epps.conScore || 7) / 15) * 100;
    pillar.personality = Math.round(Math.min(100, 70 + (conS - 50) * 0.4));
  }

  if (by_subtest.papi || by_subtest.holland) {
    let papiFit = 60;
    let holFit = 60;
    if (by_subtest.papi?.scores) {
      const s = by_subtest.papi.scores;
      if ((s.C || 0) >= 6 && (s.T || 0) >= 6) papiFit = 90;
      else if ((s.W || 0) >= 8) papiFit = 55;
      else papiFit = 70;
    }
    if (by_subtest.holland?.code3) {
      const code = by_subtest.holland.code3;
      if (code.includes('I')) holFit = 95;
      else if (code.includes('C')) holFit = 80;
      else holFit = 55;
    }
    pillar.workAttitude = Math.round(papiFit * 0.5 + holFit * 0.5);
  }

  return finalizeOverall(pillar);
}

// Battery C — EPPS+SJT blend (personality) + PAPI leadership rule (work attitude).
function calcPillarsC(by_subtest) {
  const pillar = { cognitive: baseCognitive(by_subtest), personality: null, workAttitude: null, overall: null };

  {
    const conS = by_subtest.epps?.conScore;
    const sjtPct = by_subtest.sjt?.overallPct;
    const eppsScaled = conS != null ? Math.min(100, Math.max(0, 70 + (conS / 15 - 0.5) * 40)) : null;
    const sjtScaled = sjtPct != null ? sjtPct : null;
    const vals = [eppsScaled, sjtScaled].filter((v) => v != null);
    if (vals.length) pillar.personality = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  if (by_subtest.papi?.scores) {
    const { L = 0, I = 0, K = 0, F = 0 } = by_subtest.papi.scores;
    if (L >= 5 && I >= 5) pillar.workAttitude = 90;
    else if (K >= 7 && F >= 7) pillar.workAttitude = 50;
    else pillar.workAttitude = 70;
  }

  return finalizeOverall(pillar);
}

// Battery D — 16PF executive cluster (personality) + MSDT/PAPI-L (work attitude).
function calcPillarsD(by_subtest) {
  const pillar = { cognitive: baseCognitive(by_subtest), personality: null, workAttitude: null, overall: null };

  if (by_subtest.pf?.std) {
    const s = by_subtest.pf.std;
    const C = s.C ?? 5, Q3 = s.Q3 ?? 5, Q4 = s.Q4 ?? 5;
    const E = s.E ?? 5, H = s.H ?? 5, O = s.O ?? 5;
    const exec = (C * 10 + Q3 * 10 + (11 - Q4) * 10 + E * 6 + H * 6 + (11 - O) * 6) / 4.8;
    pillar.personality = Math.round(Math.max(0, Math.min(100, exec)));
  }

  if (by_subtest.msdt || by_subtest.papil) {
    const msdtFit = by_subtest.msdt?.effectPct != null ? Math.min(100, by_subtest.msdt.effectPct) : 60;
    let papilFit = 60;
    if (by_subtest.papil?.scores) {
      const { L = 0, I = 0, K = 0, F = 0 } = by_subtest.papil.scores;
      if (L >= 5 && I >= 5) papilFit = 90;
      else if (K >= 6 && F >= 6) papilFit = 50;
      else papilFit = 70;
    }
    pillar.workAttitude = Math.round(msdtFit * 0.5 + papilFit * 0.5);
  }

  return finalizeOverall(pillar);
}

export function calcPillars(battery, by_subtest) {
  if (!by_subtest) return { cognitive: null, personality: null, workAttitude: null, overall: null };
  switch (battery) {
    case 'A': return calcPillarsA(by_subtest);
    case 'B': return calcPillarsB(by_subtest);
    case 'C': return calcPillarsC(by_subtest);
    case 'D': return calcPillarsD(by_subtest);
    default: return { cognitive: null, personality: null, workAttitude: null, overall: null };
  }
}
