// Shared between PipelineTable.jsx and CandidatePipelineDetail.jsx — kept out
// of PipelineTable.jsx itself so that file exports only its component
// (react-refresh/only-export-components requires this for Fast Refresh).

// Experience buckets — the parent page translates a bucket id into the
// min/max it sends the server (filtering happens in SQL, not in the browser).
export const EXPERIENCE_BUCKETS = [
  { id: '0-2',  label: '0–2 years',   min: 0,  max: 2 },
  { id: '3-5',  label: '3–5 years',   min: 3,  max: 5 },
  { id: '6-10', label: '6–10 years',  min: 6,  max: 10 },
  { id: '10+',  label: '10+ years',   min: 11, max: Infinity },
];

export const ROWS_PER_PAGE = 15;
