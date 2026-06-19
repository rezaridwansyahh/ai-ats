import { useState } from 'react';
import {
  MapPin, ChevronDown, ChevronUp, AlertTriangle,
  MessageCircle, Sparkles, Megaphone, BookmarkCheck,
} from 'lucide-react';

/* ─────────────────────────────────────────
   STAGE DEFINITIONS (fallback)
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

/* ─────────────────────────────────────────
   DUMMY DATA
   ───────────────────────────────────────── */
const DUMMY_JOB = {
  id: 'JOB-2148',
  title: 'Sr. Frontend Developer',
  headcount: 10,
  status: 'Active',
  deadline: '15 Mar 2026',
  days_open: 18,
  cities: [
    {
      id: 'jakarta',
      name: 'Jakarta',
      coordinator: { initials: 'ST', name: 'Sarah Tan', color: 'bg-teal-500' },
      hired: 1,
      quota: 3,
      behind_quota: false,
      columns: {
        applied:   [
          { id: 'c1', initials: 'RP', name: 'Raka Prasetya',    role: 'Frontend Dev',  exp: '4y', salary: 'Rp 18M', score: 76, tags: ['React', 'TypeScript'], source: 'JobStreet', ago: '1d', color: 'bg-orange-400', overdue: false, comments: 0 },
        ],
        screening: [
          { id: 'c2', initials: 'RF', name: 'Rizky Firmansyah', role: 'Frontend Dev',  exp: '5y', salary: 'Rp 18M', score: 91, tags: ['React', 'TypeScript'], source: 'LinkedIn',  ago: '4d', color: 'bg-blue-500',   overdue: false, comments: 0 },
        ],
        interview: [
          { id: 'c3', initials: 'DS', name: 'Dewi Sartika',     role: 'Sr. Frontend',  exp: '8y', salary: 'Rp 22M', score: 94, tags: ['React', 'TypeScript'], source: 'LinkedIn',  ago: '2d', color: 'bg-green-500',  overdue: false, comments: 2 },
        ],
        psych:    [],
        medical:  [],
        bg_check: [],
        offer:    [
          { id: 'c4', initials: 'PH', name: 'Putri Handayani',  role: 'Frontend Dev',  exp: '4y', salary: 'Rp 17M', score: 78, tags: ['React', 'Next.js'],    source: 'LinkedIn',  ago: '8d', color: 'bg-pink-500',    overdue: false, comments: 5 },
        ],
        hired:    [],
      },
    },
    {
      id: 'bandung',
      name: 'Bandung',
      coordinator: { initials: 'MH', name: 'Maya Hartono', color: 'bg-purple-500' },
      hired: 0,
      quota: 2,
      behind_quota: true,
      columns: {
        applied:   [
          { id: 'c5', initials: 'MP', name: 'Maya Pramitasari', role: 'Frontend Dev',  exp: '4y', salary: 'Rp 16M', score: 87, tags: ['React', 'TypeScript'], source: 'Kalibrr',  ago: '1d', color: 'bg-violet-500', overdue: false, comments: 0 },
          { id: 'c6', initials: 'BK', name: 'Budi Kurniawan',   role: 'Frontend Dev',  exp: '5y', salary: 'Rp 14M', score: 74, tags: ['React', 'JavaScript'], source: 'Kalibrr',  ago: '2d', color: 'bg-blue-400',   overdue: false, comments: 0 },
        ],
        screening: [],
        interview: [],
        psych:    [],
        medical:  [],
        bg_check: [],
        offer:    [],
        hired:    [],
      },
    },
    {
      id: 'surabaya',
      name: 'Surabaya',
      coordinator: { initials: 'RF', name: 'Reza Firmansyah', color: 'bg-amber-500' },
      hired: 0,
      quota: 2,
      behind_quota: false,
      columns: {
        applied:   [],
        screening: [
          { id: 'c7', initials: 'AS', name: 'Agus Setiawan',   role: 'Frontend Dev',  exp: '5y', salary: 'Rp 20M', score: 82, tags: ['React', 'TypeScript'], source: 'JobStreet', ago: '3d', color: 'bg-teal-500',   overdue: false, comments: 1 },
        ],
        interview: [
          { id: 'c8', initials: 'SN', name: 'Siti Nurhaliza',  role: 'Frontend Dev',  exp: '6y', salary: 'Rp 18M', score: 81, tags: ['React', 'TypeScript'], source: 'Referral',  ago: '3d', color: 'bg-orange-500', overdue: false, comments: 2 },
        ],
        psych:    [],
        medical:  [],
        bg_check: [],
        offer:    [],
        hired:    [],
      },
    },
  ],
};

/* ─────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────── */
const SOURCE_COLORS = {
  LinkedIn:  'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  JobStreet: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  Kalibrr:   'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  Referral:  'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
};

// Group a flat candidates[] (with stage_id + city fields) into the
// cities[] shape KanbanBoard expects. Used when real API data is passed in.
function groupCandidatesIntoCities({ candidates = [], stages = [] }) {
  const cityMap = {};

  for (const c of candidates) {
    const cityId   = c.city_id   ?? c.city   ?? 'unknown';
    const cityName = c.city_name ?? c.city   ?? 'Unknown';
    const stageId  = c.stage_id  ?? c.latest_stage ?? 'applied';

    if (!cityMap[cityId]) {
      cityMap[cityId] = {
        id:          cityId,
        name:        cityName,
        coordinator: c.coordinator ?? { initials: '?', name: 'Unassigned', color: 'bg-slate-400' },
        hired:       0,
        quota:       c.city_quota ?? 0,
        behind_quota: false,
        columns:     Object.fromEntries(stages.map((s) => [s.id, []])),
      };
    }

    const city = cityMap[cityId];
    if (!city.columns[stageId]) city.columns[stageId] = [];

    city.columns[stageId].push({
      id:       c.id ?? c.applicant_id,
      initials: (c.name ?? c.applicant_name ?? '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
      name:     c.name ?? c.applicant_name ?? `#${c.applicant_id}`,
      role:     c.role ?? c.position ?? '—',
      exp:      c.experience ?? c.exp ?? '—',
      salary:   c.expected_salary ?? c.salary ?? '—',
      score:    c.overall_score ?? c.score ?? null,
      tags:     c.skills ?? c.tags ?? [],
      source:   c.source ?? null,
      ago:      c.applied_ago ?? c.ago ?? '—',
      color:    c.avatar_color ?? 'bg-primary',
      overdue:  c.overdue ?? false,
      comments: c.comment_count ?? c.comments ?? 0,
    });

    if (stageId === 'hired') city.hired += 1;
  }

  return Object.values(cityMap).map((city) => ({
    ...city,
    behind_quota: city.hired < city.quota,
  }));
}

/* ─────────────────────────────────────────
   CANDIDATE CARD
   ───────────────────────────────────────── */
function CandidateCard({ c, onSelect }) {
  const scoreColor =
    c.score >= 90 ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
    : c.score >= 75 ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
    : c.score != null ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
    : 'bg-muted text-muted-foreground';

  return (
    <div
      className="bg-card rounded-xl p-3 border border-border/60 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
      onClick={() => onSelect?.(c)}
    >
      {/* Row 1 — avatar + name + score */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-7 h-7 rounded-full ${c.color} text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0 shadow-sm`}>
            {c.initials}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold truncate leading-tight">{c.name}</p>
            <p className="text-[10px] text-muted-foreground truncate leading-tight">{c.role}</p>
            <p className="text-[9px] text-muted-foreground/60 truncate">{c.exp} · {c.salary}</p>
          </div>
        </div>
        {c.score != null && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${scoreColor}`}>
            {c.score}
          </span>
        )}
      </div>

      {/* Skill tags */}
      {c.tags?.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-2">
          {c.tags.map((tag) => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom row — time · comments · source */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground/70">{c.ago} ago</span>
          {c.comments > 0 && (
            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
              <MessageCircle className="h-2.5 w-2.5" />
              {c.comments}
            </span>
          )}
        </div>
        {c.source && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${SOURCE_COLORS[c.source] || 'bg-muted text-muted-foreground'}`}>
            {c.source}
          </span>
        )}
      </div>

      {c.overdue && (
        <div className="flex items-center gap-1 mt-1.5 text-[9px] text-red-600 font-semibold">
          <AlertTriangle className="h-3 w-3" />
          Overdue
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   CITY PIPELINE GROUP
   ───────────────────────────────────────── */
function CityPipelineGroup({ city, stages, onSelectCandidate }) {
  const [collapsed, setCollapsed] = useState(false);
  const inPipeline = stages.reduce((sum, s) => sum + (city.columns[s.id]?.length || 0), 0);
  const pct = city.quota > 0 ? Math.min(100, Math.round((city.hired / city.quota) * 100)) : 0;

  return (
    <div className="rounded-2xl border-2 border-border bg-card shadow-md overflow-hidden">

      {/* City header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-muted/60 to-muted/15 border-b-2 border-border/60 cursor-pointer hover:from-muted/80 hover:to-muted/25 transition-colors select-none"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            {city.name}
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`h-5 w-5 rounded-full ${city.coordinator.color} text-white flex items-center justify-center text-[8px] font-bold shadow-sm ring-1 ring-border/40`}>
              {city.coordinator.initials}
            </div>
            <span className="text-[11px] text-muted-foreground">{city.coordinator.name}</span>
          </div>
          {city.behind_quota && (
            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
              {city.name} behind quota
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono font-semibold">{city.hired}/{city.quota}</span>
              <span className="text-[10px] text-muted-foreground">hired</span>
            </div>
            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${city.hired >= city.quota ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {inPipeline} in pipeline
          </span>
          {collapsed
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            : <ChevronUp   className="h-3.5 w-3.5 text-muted-foreground" />
          }
        </div>
      </div>

      {/* Stage columns */}
      {!collapsed && (
        <div className="flex gap-0 overflow-x-auto">
          {stages.map((stage, i) => {
            const cards = city.columns[stage.id] || [];
            return (
              <div
                key={stage.id}
                className={`flex-1 min-w-[160px] ${i < stages.length - 1 ? 'border-r border-border/30' : ''}`}
              >
                <div className={`h-1 ${stage.color}`} />
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-muted/10">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${stage.color}`} />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {stage.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-muted-foreground/60 bg-muted/60 px-1.5 rounded">
                    {cards.length}
                  </span>
                </div>
                <div className="p-2 space-y-2 min-h-[80px]">
                  {cards.length === 0 ? (
                    <div className="flex items-center justify-center h-16 rounded-lg border border-dashed border-border/40">
                      <span className="text-[9px] text-muted-foreground/30">No candidates</span>
                    </div>
                  ) : (
                    cards.map((c) => (
                      <CandidateCard key={c.id} c={c} onSelect={onSelectCandidate} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   STAGE SUMMARY PILLS
   ───────────────────────────────────────── */
function StageSummaryBar({ cities, stages }) {
  const totals = {};
  stages.forEach((s) => {
    totals[s.id] = cities.reduce((sum, city) => sum + (city.columns[s.id]?.length || 0), 0);
  });

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {stages.map((s) => {
        const count = totals[s.id];
        if (!count) return null;
        return (
          <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[10px] font-semibold text-foreground">
            <span className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
            <span className="font-mono">{count}</span>
            {s.label}
          </span>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   FILTER BAR
   ───────────────────────────────────────── */
function PipelineFilterBar({ onAddCandidate }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-card text-xs font-medium hover:bg-muted/50 hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        AI filter
      </button>
      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-card text-xs font-medium hover:bg-muted/50 hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground">
        <Megaphone className="h-3.5 w-3.5" />
        Campaign
      </button>
      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-card text-xs font-medium hover:bg-muted/50 hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground">
        <BookmarkCheck className="h-3.5 w-3.5" />
        Reserve
        <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-primary/10 text-primary leading-none">
          NEW
        </span>
      </button>
      <button
        onClick={onAddCandidate}
        className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
      >
        + Add candidate
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   JOB CONTEXT BAR (named export)
   ───────────────────────────────────────── */
export function JobContextBar({ job }) {
  if (!job) return null;

  const statusColor =
    job.status === 'Active'  ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800'
    : job.status === 'Expired' ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800'
    : 'bg-muted text-muted-foreground border-border';

  const totalHired = job.cities?.reduce((s, c) => s + c.hired, 0) ?? 0;

  return (
    <div className="flex items-center gap-3 px-1 py-1 flex-wrap text-[11px]">
      <span className="font-mono font-semibold text-foreground">{job.id}</span>
      <span className="text-muted-foreground/40">·</span>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-semibold text-[10px] ${statusColor}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        {job.status}
      </span>
      <span className="text-muted-foreground/40">·</span>
      <span className="font-mono">
        HIRED <span className="font-bold text-foreground">{totalHired}</span>
        <span className="text-muted-foreground">/{job.headcount}</span>
      </span>
      {job.deadline && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-muted-foreground">
            DEADLINE <span className="font-semibold text-foreground">{job.deadline}</span>
          </span>
        </>
      )}
      {job.days_open != null && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span className={`font-semibold ${job.days_open > 30 ? 'text-red-500' : 'text-muted-foreground'}`}>
            {job.days_open}d open
          </span>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN EXPORT
   Props:
     job        — job object (falls back to DUMMY_JOB)
     stages     — stage list from API (falls back to DEFAULT_STAGES)
     candidates — flat candidates[] from API (optional; if provided,
                  cities[] is built from them instead of job.cities)
     onSelectCandidate — called with candidate object on card click
   ───────────────────────────────────────── */
export default function KanbanBoard({
  job = DUMMY_JOB,
  stages,
  candidates,
  onSelectCandidate,
}) {
  // Resolve stage list: API stages → DEFAULT_STAGES fallback
  const resolvedStages = (stages?.length > 0)
    ? stages.map((s) => ({
        id:    s.id,
        label: s.name ?? s.label,
        color: s.color ?? 'bg-slate-400',
      }))
    : DEFAULT_STAGES;

  // Resolve cities: if real candidates passed in, group them; else use job.cities
  const resolvedCities = (candidates?.length > 0)
    ? groupCandidatesIntoCities({ candidates, stages: resolvedStages })
    : (job.cities ?? []);

  const totalHired = resolvedCities.reduce((s, c) => s + c.hired, 0);

  return (
    <div className="space-y-3">

      {/* Job title + summary */}
      <div className="space-y-1">
        <h2 className="text-sm font-bold">{job.title}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-muted-foreground">
            {resolvedCities.length} {resolvedCities.length === 1 ? 'city' : 'cities'} ·{' '}
            <span className={totalHired >= job.headcount ? 'text-green-600 font-semibold' : ''}>
              {totalHired}/{job.headcount} hired
            </span>
          </span>
          <StageSummaryBar cities={resolvedCities} stages={resolvedStages} />
        </div>
      </div>

      {/* Filter bar */}
      <PipelineFilterBar />

      {/* City groups */}
      <div className="space-y-3">
        {resolvedCities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 py-12 text-center">
            <p className="text-xs text-muted-foreground">No candidates in the pipeline yet.</p>
          </div>
        ) : (
          resolvedCities.map((city) => (
            <CityPipelineGroup
              key={city.id}
              city={city}
              stages={resolvedStages}
              onSelectCandidate={onSelectCandidate}
            />
          ))
        )}
      </div>

    </div>
  );
}