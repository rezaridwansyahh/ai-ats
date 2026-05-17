import { useRef, useState } from 'react';
import { streamSectionInterpretation, streamSynthesis } from '@/api/assessment-ai.api';

const SYNTHESIS_TAG_TO_NARR = {
  KONSOL: 'narr-konsol',
  STRENGTH: 'narr-strength',
  DEV: 'narr-dev',
  FIT: 'narr-fit',
};

// Parse tagged synthesis output incrementally. Given the accumulated raw text so far,
// return a map { 'narr-konsol': 'partial text', 'narr-strength': 'partial text', ... }.
// Partial closers (e.g. [/KONS) are left in the buffer until the full tag arrives.
function parseSynthesisBuffer(raw) {
  const out = {};
  for (const [tag, narrId] of Object.entries(SYNTHESIS_TAG_TO_NARR)) {
    const openIdx = raw.indexOf(`[${tag}]`);
    if (openIdx === -1) continue;
    const start = openIdx + tag.length + 2;
    const closeIdx = raw.indexOf(`[/${tag}]`, start);
    out[narrId] = closeIdx === -1 ? raw.slice(start) : raw.slice(start, closeIdx);
  }
  return out;
}

export function useNarrativeAI({ updateState, saveNow }) {
  // generatingId values: a narrative id ('narr-tk', etc.), 'synthesis', or null.
  const [generatingId, setGeneratingId] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const cancel = () => {
    abortRef.current?.abort();
  };

  const generateSection = async ({ battery, section, narrId, scores, profile, currentValue }) => {
    if (!scores) {
      setError('Data skor untuk bagian ini belum tersedia.');
      return;
    }
    if (currentValue && currentValue.trim() &&
        !window.confirm('Tulisan saat ini akan ditimpa AI. Lanjutkan?')) {
      return;
    }
    setError(null);
    abortRef.current = new AbortController();
    setGeneratingId(narrId);
    // Clear textarea so streamed text replaces (not appends to) old content.
    updateState({ ['edit_' + narrId]: '' });

    try {
      await streamSectionInterpretation(
        { battery, section, scores, profile },
        (_delta, fullText) => {
          updateState({ ['edit_' + narrId]: fullText });
        },
        abortRef.current.signal,
      );
    } catch (e) {
      if (e?.name !== 'AbortError') {
        setError(e?.message || 'Gagal membuat interpretasi.');
        console.error('[useNarrativeAI] section error', e);
      }
    } finally {
      setGeneratingId(null);
      abortRef.current = null;
      // Auto-flush so the generated paragraph isn't sitting only in the debounce queue.
      try { await saveNow?.(); } catch { /* save errors surfaced via parent saveStatus */ }
    }
  };

  const generateSynthesis = async ({ battery, allScores, sectionInterpretations, profile, currentValues }) => {
    const anyNonEmpty = Object.values(currentValues || {}).some((v) => (v || '').trim().length > 0);
    if (anyNonEmpty &&
        !window.confirm('Tulisan sintesis saat ini akan ditimpa AI. Lanjutkan?')) {
      return;
    }
    setError(null);
    abortRef.current = new AbortController();
    setGeneratingId('synthesis');

    // Clear all synthesis slots before streaming begins so old content doesn't peek through.
    const initialClear = {};
    for (const id of Object.values(SYNTHESIS_TAG_TO_NARR)) initialClear['edit_' + id] = '';
    updateState(initialClear);

    try {
      await streamSynthesis(
        { battery, allScores, sectionInterpretations, profile },
        (_delta, fullText) => {
          const parsed = parseSynthesisBuffer(fullText);
          // Build a single patch object so updateState fires once per chunk.
          const patch = {};
          for (const [narrId, txt] of Object.entries(parsed)) {
            patch['edit_' + narrId] = txt;
          }
          if (Object.keys(patch).length) updateState(patch);
        },
        abortRef.current.signal,
      );
    } catch (e) {
      if (e?.name !== 'AbortError') {
        setError(e?.message || 'Gagal membuat sintesis.');
        console.error('[useNarrativeAI] synthesis error', e);
      }
    } finally {
      setGeneratingId(null);
      abortRef.current = null;
      try { await saveNow?.(); } catch { /* save errors surfaced via parent saveStatus */ }
    }
  };

  return {
    generatingId,
    error,
    generateSection,
    generateSynthesis,
    cancel,
    isGenerating: (id) => generatingId === id,
    isSynthGenerating: () => generatingId === 'synthesis',
  };
}
