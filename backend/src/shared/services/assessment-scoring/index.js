// Server-side authoritative scoring registry. Given one subtest's ordered
// question list (with content) and the candidate's answers, returns the same
// score-object shape the frontend's `utils/scoring.js` files already produce
// — so nothing downstream (report rendering, PDF export, dashboards) needs to
// change. This replaces trusting whatever score JSON the client POSTs.
//
// `answersByOrderIndex` — plain object keyed by question order_index (NOT
// question_id), matching how every candidate test component keys its local
// `answers` state. Build it from assessment_answer rows joined to
// assessment_question for order_index.

import {
  rawToPercentile, pctToScore10, getGrade, getVerdict, normalizeAns,
  checkGIAnswer, scoreTkSubtest, computeTkComposite,
} from './cognitive.scoring.js';
import { scoreBigFive } from './bigfive.scoring.js';
import { scoreDISC } from './disc.scoring.js';
import { scoreHollandA, scoreHollandB } from './holland.scoring.js';
import { scoreEPPS } from './epps.scoring.js';
import { scorePapi, getPapiRange } from './papi.scoring.js';
import { scoreSJT, lvlSJT } from './sjt.scoring.js';
import { scoreMSDT } from './msdt.scoring.js';
import { scorePF16 } from './pf16.scoring.js';

// assessment_id -> battery letter, matching assessment-qa.pdf.js's own
// BATTERY_BY_ASSESSMENT_ID mapping (kept in sync, not re-derived from DB,
// since master_assessment has no explicit "battery letter" column).
const BATTERY_BY_ASSESSMENT_ID = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'I', 6: 'T' };

// Scorers that need the shared cognitive helpers (pctToScore10/getVerdict)
// take them as an explicit dependency object rather than importing
// cognitive.scoring.js themselves, to keep each instrument module
// independently testable/readable in isolation.
const cognitiveDeps = { pctToScore10, getVerdict };

export function scoreSubtest({ assessment_id, subtest_key, group_key, items, answersByOrderIndex }) {
  if (group_key === 'tk') {
    return scoreTkSubtest(subtest_key, items, answersByOrderIndex);
  }

  switch (subtest_key) {
    case 'bigfive':
      return scoreBigFive(items, answersByOrderIndex);
    case 'disc':
      return scoreDISC(items, answersByOrderIndex);
    case 'holland': {
      const battery = BATTERY_BY_ASSESSMENT_ID[assessment_id];
      return battery === 'A'
        ? scoreHollandA(items, answersByOrderIndex)
        : scoreHollandB(items, answersByOrderIndex);
    }
    case 'epps':
      return scoreEPPS(items, answersByOrderIndex);
    case 'papi':
    case 'papil':
      return scorePapi(items, answersByOrderIndex);
    case 'sjt':
      return scoreSJT(items, answersByOrderIndex, cognitiveDeps);
    case 'msdt':
      return scoreMSDT(items, answersByOrderIndex, cognitiveDeps);
    case 'pf':
      return scorePF16(items, answersByOrderIndex);
    default:
      throw new Error(`No server-side scorer registered for subtest_key="${subtest_key}"`);
  }
}

export {
  rawToPercentile, pctToScore10, getGrade, getVerdict, normalizeAns,
  checkGIAnswer, scoreTkSubtest, computeTkComposite, getPapiRange, lvlSJT,
  BATTERY_BY_ASSESSMENT_ID,
};
