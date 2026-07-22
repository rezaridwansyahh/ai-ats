import { useEffect, useMemo, useState } from 'react';
import { Search, MessageCircle, AlertTriangle } from 'lucide-react';

/* ─────────────────────────────────────────
   STAGE DEFINITIONS (fallback — mirrors KanbanBoard)
   ───────────────────────────────────────── */
const DEFAULT_STAGES = [
  { id: 'applied',   label: 'Applied',   color: 'bg-slate-400' },
  { id: 'screening', label: 'Screening', color: 'bg-blue-400' },
  { id: 'interview', label: 'Interview', color: 'bg-violet-400' },
  { id: 'psych',     label: 'Psych',     color: 'bg-purple-400' },
  { id: 'medical',   label: 'Medical',   color: 'bg-amber-400' },
  { id: 'bg_check',  label: 'BG Check',  color: 'bg-orange-400' },
  { id: 'offer',     label: 'Offer',     color: 'bg-teal-400' },
  { id: 'hired',     label: 'Hired',     color: 'bg-green-500' },
];

const ROWS_PER_PAGE = 15;

/* ─────────────────────────────────────────
   Flatten input into row objects.
   Supports the same two input shapes KanbanBoard does:
   - flat `candidates[]` (from real API data via CandidatePipelineDetailPage)
   - nested `job.cities[].columns` (dummy/demo shape)
   ───────────────────────────────────────── */
function buildRows({ candidates, job, stages }) {
  const stageMap = Object.fromEntries(stages.map((s) => [s.id, s]));

  if (candidates?.length > 0) {
    return candidates.map((c) => {
      const stageId = c.stage_id ?? c.latest_stage ?? 'applied';
      const stage = stageMap[stageId] ?? { id: stageId, label: stageId, color: 'bg-slate-400' };
      return {
        id:       c.id ?? c.applicant_id,
        raw:      c,
        initials: (c.name ?? c.applicant_name ?? '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
        name:     c.name ?? c.applicant_name ?? `#${c.applicant_id}`,
        role:     c.role ?? c.position ?? '—',
        city:     c.city_name ?? c.city ?? '—',
        stageId:  stage.id,
        stageLabel: stage.label,
        stageColor: stage.color,
        exp:      c.experience ?? c.exp ?? '—',
        tags:     c.skills ?? c.tags ?? [],
        ago:      c.applied_ago ?? c.ago ?? '—',
        color:    c.avatar_color ?? 'bg-primary',
        overdue:  c.overdue ?? false,
        comments: c.comment_count ?? c.comments ?? 0,
      };
    });
  }

  // Fallback: flatten job.cities[].columns (dummy/demo shape)
  const rows = [];
  for (const city of job?.cities ?? []) {
    for (const stage of stages) {
      const cards = city.columns?.[stage.id] ?? [];
      for (const c of cards) {
        rows.push({
          id: c.id,
          raw: c,
          initials: c.initials,
          name: c.name,
          role: c.role,
          city: city.name,
          stageId: stage.id,
          stageLabel: stage.label,
          stageColor: stage.color,
          exp: c.exp,
          tags: c.tags ?? [],
          ago: c.ago,
          color: c.color,
          overdue: c.overdue,
          comments: c.comments,
        });
      }
    }
  }
  return rows;
}

function StagePill({ label, color }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs font-semibold text-foreground whitespace-nowrap">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function SkillsCell({ tags }) {
  if (!tags?.length) return <span className="text-xs text-muted-foreground">—</span>;
  const shown = tags.slice(0, 2);
  const extra = tags.length - shown.length;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {shown.map((tag) => (
        <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium whitespace-nowrap">
          {tag}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-[10px] px-2 py-0.5 rounded bg-muted/60 text-muted-foreground/70 font-medium whitespace-nowrap">
          +{extra} more
        </span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN EXPORT — same props shape as KanbanBoard, plus onSummaryChange
   ───────────────────────────────────────── */
export default function PipelineTable({
  job,
  stages,
  candidates,
  onSelectCandidate,
  onSummaryChange,
}) {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [page, setPage] = useState(1);

  const resolvedStages = (stages?.length > 0)
    ? stages.map((s) => ({ id: s.id, label: s.name ?? s.label, color: s.color ?? 'bg-slate-400' }))
    : DEFAULT_STAGES;

  const rows = useMemo(
    () => buildRows({ candidates, job, stages: resolvedStages }),
    [candidates, job, resolvedStages]
  );

  const totalHired = useMemo(
    () => rows.filter((r) => r.stageLabel?.toLowerCase() === 'hired').length,
    [rows]
  );

  // Report summary up to the parent page so it can render one page-level
  // header instead of duplicating this info inside the table itself.
  useEffect(() => {
    onSummaryChange?.({ totalInPipeline: rows.length, totalHired });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length, totalHired]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch = !q ||
        r.name?.toLowerCase().includes(q) ||
        r.role?.toLowerCase().includes(q);
      const matchesStage = stageFilter === 'all' || String(r.stageId) === String(stageFilter);
      return matchesSearch && matchesStage;
    });
  }, [rows, search, stageFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  return (
    <div className="space-y-3">

      {/* Search + stage filter */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or role..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All stages</option>
          {resolvedStages.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {filteredRows.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {rows.length === 0 ? 'No candidates in the pipeline yet.' : 'No candidates match your search.'}
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 text-left">Candidate</th>
                  <th className="px-4 py-3 text-left">Stage</th>
                  <th className="px-4 py-3 text-left">Experience</th>
                  <th className="px-4 py-3 text-left">Skills</th>
                  <th className="px-4 py-3 text-left">Applied</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => onSelectCandidate?.(r.raw ?? { id: r.id })}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${r.color} text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>
                          {r.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                            {r.name}
                            {r.overdue && <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{r.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StagePill label={r.stageLabel} color={r.stageColor} />
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{r.exp}</td>
                    <td className="px-4 py-3.5"><SkillsCell tags={r.tags} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {r.ago} ago
                        {r.comments > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" /> {r.comments}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-t">
              <span className="text-xs text-muted-foreground">
                {(currentPage - 1) * ROWS_PER_PAGE + 1}–
                {Math.min(currentPage * ROWS_PER_PAGE, filteredRows.length)} of {filteredRows.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-8 px-3 text-xs border rounded-md text-muted-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-xs text-muted-foreground px-1">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 px-3 text-xs border rounded-md text-muted-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}