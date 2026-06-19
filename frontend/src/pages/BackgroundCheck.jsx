import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, FileText, GitBranch, Check, ChevronRight, ChevronDown,
  Mail, FolderKanban, ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* ─────────────────────────────────────────────────────────────────────────────
   DUMMY DATA
   Replace `backgroundCheckMock` with a real fetch later — nothing else changes.
───────────────────────────────────────────────────────────────────────────── */

const backgroundCheckMock = {
  job: {
    id: 'JOB-2148',
    title: 'Sales Executive Management Trainee',
    status: 'Active',
    hired: '4/10',
    deadline: '15 Mar 2026',
    daysOpen: 18,
  },

  candidate: {
    name: 'Bagus Pratama',
  },

  setup: {
    emailTemplate: {
      label: 'BG-CHECK',
      subject: 'Verifikasi background — JOB-2127 (Sr. Backend Engineer)',
      greeting: 'Halo Bagus,',
      bodyParagraph:
        'Untuk melanjutkan ke tahap final, mohon kesediaan Anda untuk melengkapi proses verifikasi background. Klik tautan di bawah untuk mengunggah dokumen (KTP, ijazah, slip gaji terakhir) dan memberikan persetujuan.',
      link: 'myralix.id/bg/r/8K3a92',
      expiryNote: 'Tautan berlaku 7 hari. Tidak ada akun yang perlu dibuat.',
    },
    activeRequests: [
      { name: 'Bagus Pratama', meta: 'Sent 2h ago',    status: 'awaiting'  },
      { name: 'Maya Sari',     meta: 'Replied 12h ago', status: 'collected' },
      { name: 'Rina Putri',    meta: 'Sent 4h ago',    status: 'awaiting'  },
    ],
    emailsSentToday: 2,
    emailsTotalToday: 3,
    autoReminderHours: 48,
  },

  verification: {
    lanes: [
      {
        key: 'identity',
        label: 'Identity',
        sublabel: 'VERIHUBS',
        detail: 'KTP + face match · 99.4% confidence',
        percent: 100,
        status: 'clear',
      },
      {
        key: 'education',
        label: 'Education',
        sublabel: 'SIVIL 4XMDK2GUD',
        detail: 'ITB MG verified via SIVIL',
        percent: 100,
        status: 'clear',
      },
      {
        key: 'employment',
        label: 'Employment',
        sublabel: 'DIRECT HR',
        detail: 'Bibit confirmed · prev. role tenure mismatch (claimed 24mo, HR says 19mo)',
        percent: 75,
        status: 'review',
      },
      {
        key: 'criminal',
        label: 'Criminal',
        sublabel: 'POLRI / SKCK',
        detail: 'SKCK valid until 2027 · no flags',
        percent: 90,
        status: 'clear',
      },
    ],
  },

  decision: {
    lanes: [
      { key: 'identity',   label: 'Identity',   status: 'clear',  note: null },
      { key: 'education',  label: 'Education',  status: 'clear',  note: null },
      { key: 'employment', label: 'Employment', status: 'review', note: 'Tenure mismatch 5 mo' },
      { key: 'criminal',   label: 'Criminal',   status: 'clear',  note: null },
    ],
    reviewerNote:
      'Tenure mismatch on Bibit role (5 mo). Asked candidate to clarify — they referenced overlap with notice period. HR confirmed start date. Acceptable, advancing.',
    banner: {
      type: 'conditional',
      message: 'Conditional · Employment lane needs reviewer note',
    },
  },
};

// Alternative jobs for the context-switcher dropdown
const alternativeJobsMock = [
  {
    id: 'JOB-2148',
    title: 'Sales Executive Management Trainee',
    meta: 'Active · 4/10 hired · deadline 15 Mar 2026',
    active: true,
  },
  {
    id: 'JOB-2127',
    title: 'Sr. Backend Engineer',
    meta: 'Active · 2/5 hired · deadline 1 Apr 2026',
    active: false,
  },
  {
    id: 'JOB-2119',
    title: 'Product Designer',
    meta: 'Active · 0/3 hired · deadline 20 Mar 2026',
    active: false,
  },
  {
    id: 'JOB-2105',
    title: 'Data Analyst',
    meta: 'Closed · 3/3 hired',
    active: false,
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Shared status helpers
───────────────────────────────────────────────────────────────────────────── */

const TONE = {
  clear:     { pill: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600', label: 'Clear'     },
  review:    { pill: 'border-amber-200  bg-amber-50  text-amber-700',     dot: 'bg-amber-500',   label: 'Review'    },
  awaiting:  { pill: 'border-amber-200  bg-amber-50  text-amber-700',     dot: 'bg-amber-500',   label: 'Awaiting'  },
  collected: { pill: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600', label: 'Collected' },
  flag:      { pill: 'border-rose-200   bg-rose-50   text-rose-700',      dot: 'bg-rose-500',    label: 'Flag'      },
};

function StatusPill({ status }) {
  const t = TONE[status];
  if (!t) return null;
  return (
    <Badge variant="outline" className={`text-[10px] gap-1.5 whitespace-nowrap ${t.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${t.dot}`} />
      {t.label}
    </Badge>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Shared StepCard chrome  (matches Interview.jsx's StepCard exactly)
───────────────────────────────────────────────────────────────────────────── */

function StepCard({ icon: Icon, title, subtitle, headerRight, footerLeft, footerRight, children }) {
  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap px-6 py-5 bg-muted/30 border-b">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="h-9 w-9 rounded-lg border bg-card flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <div className="font-serif text-lg font-bold">{title}</div>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">{subtitle}</p>}
          </div>
        </div>
        {headerRight && (
          <div className="flex items-center gap-4 text-sm font-medium flex-shrink-0">{headerRight}</div>
        )}
      </div>

      {/* Body */}
      <div>{children}</div>

      {/* Footer */}
      {(footerLeft || footerRight) && (
        <div className="flex items-center justify-between gap-3 flex-wrap px-6 py-4 bg-muted/30 border-t text-xs">
          <div className="text-muted-foreground">{footerLeft}</div>
          <div className="flex items-center gap-2">{footerRight}</div>
        </div>
      )}
    </div>
  );
}

function NextLink({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-semibold text-foreground flex items-center gap-1 hover:underline"
    >
      Next: {label} <ArrowRight className="h-3.5 w-3.5" />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Step rail  (3 steps: Setup → Verification → Decision)
───────────────────────────────────────────────────────────────────────────── */

const STEPS = [
  { key: 'setup',    number: 1, label: 'Setup & Request',  summary: 'compose outbound' },
  { key: 'verify',   number: 2, label: 'Verification',     summary: null               },
  { key: 'decision', number: 3, label: 'Decision summary', summary: 'pending'          },
];

function StepRail({ activeKey, onSelect, verificationSummary }) {
  const activeIndex = STEPS.findIndex((s) => s.key === activeKey);

  return (
    <div className="grid grid-cols-3 border rounded-xl overflow-hidden bg-card">
      {STEPS.map((step, i) => {
        const isActive = i === activeIndex;
        const isDone   = i < activeIndex;
        const summary  = step.key === 'verify' ? (verificationSummary ?? step.summary) : step.summary;

        return (
          <button
            key={step.key}
            type="button"
            onClick={() => onSelect(step.key)}
            className={`
              flex items-center gap-3 px-5 py-4 text-left transition-colors
              ${i > 0 ? 'border-l border-border/70' : ''}
              ${isActive ? 'bg-foreground text-background' : 'bg-card hover:bg-muted/40'}
            `}
          >
            <span className={`
              h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
              ${isActive
                ? 'bg-amber-400 text-foreground'
                : isDone
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-muted text-muted-foreground'}
            `}>
              {isDone ? <Check className="h-3.5 w-3.5" /> : step.number}
            </span>
            <div>
              <div className={`text-sm font-semibold ${isActive ? 'text-background' : 'text-foreground'}`}>
                {step.label}
              </div>
              <div className={`text-[11px] ${isActive ? 'text-background/70' : isDone ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                {summary ?? 'pending'}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Step 1 — Setup & Request
───────────────────────────────────────────────────────────────────────────── */

function SetupRequestStep({ data, onNext }) {
  const { emailTemplate, activeRequests, emailsSentToday, emailsTotalToday, autoReminderHours } = data;

  return (
    <StepCard
      icon={Mail}
      title="Setup & Request"
      subtitle="Compose the outbound consent + document-request email. Candidate replies through a one-time upload link — no portal, no app install."
      headerRight={
        <button type="button" className="hover:underline font-semibold">Send request</button>
      }
      footerLeft={`${emailsSentToday} of ${emailsTotalToday} emails sent today · auto-reminder at ${autoReminderHours}h`}
      footerRight={<NextLink label="Verification" onClick={onNext} />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">

        {/* Email preview */}
        <div className="p-6">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-3">
            EMAIL TEMPLATE · {emailTemplate.label}
          </div>
          <div className="bg-muted/40 border border-border rounded-lg p-4 font-mono text-[12px] leading-relaxed text-foreground space-y-3">
            <div><span className="font-bold">Subject:</span> {emailTemplate.subject}</div>
            <div>{emailTemplate.greeting}</div>
            <div>{emailTemplate.bodyParagraph}</div>
            <div className="text-emerald-700">→ {emailTemplate.link}</div>
            <div className="text-muted-foreground">{emailTemplate.expiryNote}</div>
          </div>
          <div className="flex gap-6 mt-4">
            <button type="button" className="text-xs font-semibold hover:underline">Edit template</button>
            <button type="button" className="text-xs font-semibold hover:underline">Preview consent</button>
          </div>
        </div>

        {/* Active requests */}
        <div className="p-6">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-3">
            ACTIVE REQUESTS
          </div>
          <div className="space-y-4">
            {activeRequests.map((req) => (
              <div key={req.name} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">{req.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{req.meta}</div>
                </div>
                <StatusPill status={req.status} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </StepCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Step 2 — Verification
───────────────────────────────────────────────────────────────────────────── */

function VerificationLaneRow({ lane }) {
  const barColor = lane.status === 'review' ? 'bg-amber-500' : 'bg-emerald-600';

  return (
    <div className="flex items-center gap-5 px-6 py-4">
      {/* Label */}
      <div className="w-36 flex-shrink-0">
        <div className="text-sm font-semibold text-foreground">{lane.label}</div>
        {lane.sublabel && (
          <div className="text-[10px] font-bold tracking-wide text-muted-foreground mt-0.5">
            {lane.sublabel}
          </div>
        )}
      </div>

      {/* Detail + progress */}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground truncate">{lane.detail}</div>
        <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${lane.percent}%` }}
          />
        </div>
      </div>

      {/* Completion % */}
      <div className="text-xs text-muted-foreground w-24 text-right flex-shrink-0">
        {lane.percent}% complete
      </div>

      {/* Status pill */}
      <div className="flex-shrink-0 w-20 flex justify-end">
        <StatusPill status={lane.status} />
      </div>
    </div>
  );
}

function VerificationStep({ data, candidateName, onNext }) {
  const { lanes } = data;
  const clearCount  = lanes.filter((l) => l.status === 'clear').length;
  const reviewCount = lanes.filter((l) => l.status === 'review').length;
  const flagCount   = lanes.filter((l) => l.status === 'flag').length;

  return (
    <StepCard
      icon={FolderKanban}
      title={`Verification Workspace · ${candidateName}`}
      subtitle="One row per BG lane. Each lane has its own verdict and completion %. Reviewer sees evidence per click."
      headerRight={
        <button type="button" className="hover:underline font-semibold">Re-request docs</button>
      }
      footerLeft={`${clearCount} lanes Clear · ${reviewCount} lane${reviewCount === 1 ? '' : 's'} Review · ${flagCount} Flag`}
      footerRight={<NextLink label="Decision summary" onClick={onNext} />}
    >
      <div className="divide-y divide-border">
        {lanes.map((lane) => (
          <VerificationLaneRow key={lane.key} lane={lane} />
        ))}
      </div>
    </StepCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Step 3 — Decision Summary
───────────────────────────────────────────────────────────────────────────── */

function DecisionLaneCard({ lane }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2.5">
        {lane.label}
      </div>
      <StatusPill status={lane.status} />
      {lane.note && (
        <div className="text-xs text-muted-foreground mt-2">{lane.note}</div>
      )}
    </div>
  );
}

function DecisionSummaryStep({ data, candidateName }) {
  const { lanes, reviewerNote, banner } = data;
  const [note, setNote] = useState(reviewerNote);

  return (
    <StepCard
      icon={Check}
      title={`Decision Summary · ${candidateName}`}
      subtitle="Roll-up of all 4 lanes plus reviewer note. Fail or unresolved Hold routes the candidate to Recovery Hub."
      footerLeft={
        banner ? (
          <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {banner.message}
          </span>
        ) : null
      }
      footerRight={
        <>
          <Button variant="outline" size="sm" className="text-xs">
            Reject → Recovery
          </Button>
          <Button size="sm" className="text-xs">
            Approve & advance <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-6">
        {/* Lane roll-up */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {lanes.map((lane) => (
            <DecisionLaneCard key={lane.key} lane={lane} />
          ))}
        </div>

        {/* Reviewer note */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
            REVIEWER NOTE
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-lg p-3 text-sm text-foreground resize-y bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>
      </div>
    </StepCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Job context card  (top bar) with context-switcher dropdown
───────────────────────────────────────────────────────────────────────────── */

function JobContextCard({ job, navigate }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 flex-wrap py-4">

        {/* Job id + title with dropdown */}
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="relative" ref={dropdownRef}>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Job</div>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1.5 group mt-0.5 focus:outline-none"
            >
              <span className="text-sm font-bold text-foreground group-hover:text-foreground/80 transition-colors">
                {job.id} · {job.title}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Context-switcher popover */}
            {open && (
              <div className="absolute left-0 top-full mt-2 w-96 bg-card border border-border rounded-xl shadow-xl z-50 py-2">
                <span className="block text-[10px] font-bold text-muted-foreground px-3.5 py-1.5 tracking-wider uppercase">
                  Switch Job
                </span>
                <div className="max-h-72 overflow-y-auto px-1.5 space-y-0.5">
                  {alternativeJobsMock.map((altJob) => (
                    <button
                      key={altJob.id}
                      type="button"
                      onClick={() => setOpen(false)}
                      className={`w-full text-left p-2.5 rounded-lg transition-colors flex flex-col ${
                        altJob.active
                          ? 'bg-amber-50 border border-amber-200/70 text-foreground'
                          : 'hover:bg-muted/50 border border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="font-semibold text-sm leading-snug">
                        {altJob.id} · {altJob.title}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5 truncate">
                        {altJob.meta}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-border mt-2 pt-1.5 px-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="w-full text-left px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                  >
                    + Open Job Management
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-6 text-xs">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Status</div>
            <div className="font-semibold">{job.status}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Hired</div>
            <div className="font-semibold">{job.hired}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Deadline</div>
            <div className="font-semibold">{job.deadline}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Days Open</div>
            <div className="font-semibold text-emerald-700">{job.daysOpen}d</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate('/sourcing/job-management')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-border hover:bg-muted/50 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" /> Job page
          </button>
          <button
            type="button"
            onClick={() => navigate('/candidate-pipeline')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-border hover:bg-muted/50 transition-colors"
          >
            <GitBranch className="h-3.5 w-3.5" /> Pipeline
          </button>
        </div>

      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────────── */

export default function BackgroundCheckPage({ data = backgroundCheckMock }) {
  const [activeStep, setActiveStep] = useState('verify');
  const navigate = useNavigate();
  const { job, candidate, setup, verification, decision } = data;

  const clearCount  = verification.lanes.filter((l) => l.status === 'clear').length;
  const reviewCount = verification.lanes.filter((l) => l.status === 'review').length;
  const verificationSummary = `${verification.lanes.length} lanes · ${reviewCount} review`;

  return (
    <div className="space-y-5 p-6">

      <JobContextCard job={job} navigate={navigate} />

      <StepRail
        activeKey={activeStep}
        onSelect={setActiveStep}
        verificationSummary={verificationSummary}
      />

      {activeStep === 'setup' && (
        <SetupRequestStep data={setup} onNext={() => setActiveStep('verify')} />
      )}
      {activeStep === 'verify' && (
        <VerificationStep
          data={verification}
          candidateName={candidate.name}
          onNext={() => setActiveStep('decision')}
        />
      )}
      {activeStep === 'decision' && (
        <DecisionSummaryStep data={decision} candidateName={candidate.name} />
      )}

    </div>
  );
}
