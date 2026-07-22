import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Workflow, ListChecks, Bell, RotateCcw } from 'lucide-react';
import { JobContextCard } from '@/components/common/JobContextCard';
import { StepRail } from '@/components/offer-contract/StepRail';
import { RemunerationStep } from '@/components/offer-contract/RemunerationStep';
import { OfferLetterStep } from '@/components/offer-contract/OfferLetterStep';
import { ContractStep } from '@/components/offer-contract/ContractStep';
import { ESignatureStep } from '@/components/offer-contract/ESignatureStep';
import { OfferPipelineStep } from '@/components/offer-contract/OfferPipelineStep';

/* ─────────────────────────────────────────────────────────────────────────────
   DUMMY DATA
   Replace `offerContractMock` with a real fetch later — nothing else changes.
───────────────────────────────────────────────────────────────────────────── */

const offerContractMock = {
  job: {
    id: 'JOB-2148',
    title: 'Sales Executive Management Trainee',
    status: 'Active',
    hired: '4/10',
    deadline: '15 Mar 2026',
    daysOpen: 18,
  },

  candidate: {
    name: 'Dewi Sartika',
    role: 'Sr. Frontend Developer',
    location: 'Jakarta',
  },

  remuneration: {
    autoSchedulingOff: true,
    kpis: [
      { label: 'Active Bands',      value: '42',     sub: 'Across 12 job families',        tone: 'emerald' },
      { label: 'Median to 50th %',  value: '+3.2%',  sub: 'Above market (Mercer 2024)',     tone: 'emerald' },
      { label: 'Offer Acceptance', value: '88%',     sub: '12mo rolling · target 85%', tone: 'blue', progress: 88 },
      { label: 'Agency Commission', value: 'Rp 1.2B', sub: 'Outstanding · 8 vendors',        tone: 'amber' },
    ],
    offerBuild: [
      { label: 'Base monthly (THP)',         value: 'Rp 32.000.000', meta: '/mo' },
      { label: 'THR (1x base)',              value: 'Rp 32.000.000', meta: 'annual' },
      { label: 'Bonus target',               value: '20% of annual', meta: 'on-target' },
      { label: 'BPJS Kesehatan',              value: 'Rp 320.000',    meta: '/mo' },
      { label: 'BPJS Ketenagakerjaan',        value: 'Rp 1.440.000',  meta: '/mo' },
      { label: 'Allowances (transport, meal)', value: 'Rp 2.500.000', meta: '/mo' },
      { label: 'Sign-on bonus',               value: 'Rp 15.000.000', meta: 'one-off' },
      { label: 'Annual leave',                value: '16 days',       meta: 'allowance' },
    ],
    totalAnnualPackage: 'Rp 485.650.000',
    benchmark: {
      contextLabel: 'Sr. Frontend · 5–7y · Jakarta · Tier 1 tech',
      offerPercentile: '62nd',
      points: [
        { label: 'P10', value: 'Rp 22M' },
        { label: 'P30', value: 'Rp 27M' },
        { label: 'P50', value: 'Rp 30.5M' },
        { label: 'P75', value: 'Rp 34M' },
        { label: 'P90', value: 'Rp 40M' },
      ],
      offerPosition: 62,
    },
    aiInsight:
      'At Rp 32M base (62nd percentile), this offer is competitive vs market. Dewi\'s current package is Rp 28M → a 14% uplift, typical acceptance driver. Sign-on covers notice-period gap.',
    commissionTracker: [
      { vendor: 'KellyPerm Advisors', candidate: 'Dewi Sartika', role: 'Sr. Frontend', terms: '20% × THP × 3mo',  amount: 'Rp 19.200.000', invoiceStatus: 'awaiting', action: 'Pending start' },
      { vendor: 'Michael Page',       candidate: 'Ahmad Rivaldi', role: 'Mktg Mgr',     terms: '25% × annual base', amount: 'Rp 72.000.000', invoiceStatus: 'invoiced',  action: 'Mark paid' },
      { vendor: 'JAC Recruitment',    candidate: 'Yoga Pratama',  role: 'Sr. Backend',  terms: '18% × THP × 3mo',  amount: 'Rp 17.280.000', invoiceStatus: 'awaiting', action: 'Pending start' },
      { vendor: 'Robert Walters',     candidate: 'Rina Nuraini',  role: 'Brand Mgr',    terms: '20% × annual',     amount: 'Rp 58.800.000', invoiceStatus: 'paid',      action: 'Receipt' },
    ],
    salarySlip: {
      month: 'Month 1 Preview',
      currency: 'Rp',
      earnings: [
        { label: 'Gaji Pokok (Base)',           amount: 32000000 },
        { label: 'Tunjangan Transport',         amount: 1500000 },
        { label: 'Tunjangan Makan',             amount: 750000 },
        { label: 'Tunjangan Komunikasi',        amount: 250000 },
        { label: 'Bonus Target (20%, on-target)', amount: 6400000 },
      ],
      deductions: [
        { label: 'BPJS Kesehatan (1%)',          amount: -320000 },
        { label: 'BPJS Ketenagakerjaan (JHT 2%)', amount: -640000 },
        { label: 'BPJS Pensiun (1%)',             amount: -320000 },
        { label: 'PPh 21 (estimasi marginal)',    amount: -4180000 },
      ],
      footnote: 'Annualized: 12x THP + THR 1x + Bonus 20% target · est. only — final ditetapkan oleh Finance',
    },
  },

  offerLetter: {
    summary: 'Offer letter generation — 1 unit per personalized letter',
    autoFillNote: 'Auto-fill from package data · 3 templates (senior, mid, entry) · 2-level approval (HM + Finance) · edit-in-place',
    approvedCount: 8,
    kpis: [
      { label: 'Offers Sent',        value: '47', sub: 'This quarter',              tone: 'emerald' },
      { label: 'Accepted',           value: '41', sub: '87% acceptance rate',        tone: 'emerald', progress: 87 },
      { label: 'Awaiting Response',  value: '4',  sub: 'Avg response: 2.1 days',     tone: 'amber'   },
      { label: 'Negotiating',        value: '3',  sub: 'Counter-offers open',        tone: 'purple'  },
    ],
    workflow: [
      { label: 'Draft',               sub: 'Recruiter · HR'    },
      { label: 'Hiring Mgr approves', sub: 'Content + role'    },
      { label: 'Finance approves',    sub: 'Package + band'    },
      { label: 'Send to candidate',   sub: 'Email + portal'    },
      { label: 'Negotiate (opt)',     sub: 'Counter rounds'    },
      { label: 'Accepted',            sub: '→ Contract'        },
    ],
    preview: {
      candidateName: 'Dewi Sartika',
      role: 'Sr. Frontend Developer',
      location: 'Jakarta',
      date: '12 Maret 2024',
      ref: 'OL-2024-0342',
      titleLocal: 'Surat Penawaran Kerja',
      titleEn: 'Letter of Offer',
      greeting: 'Kepada Yth. Dewi Sartika di Jakarta,',
      intro: 'Dengan hormat, Kami dengan senang hati menawarkan posisi Sr. Frontend Developer di Myralix Indonesia, dengan rincian sebagai berikut:',
      terms: [
        { label: 'Tanggal mulai kerja',    value: '15 April 2024' },
        { label: 'Gaji pokok (THP)',       value: 'Rp 32.000.000 / bulan' },
        { label: 'Sign-on bonus',          value: 'Rp 15.000.000 (dibayar di bulan pertama)' },
        { label: 'Bonus tahunan target',   value: '20% (on-target)' },
        { label: 'THR, BPJS, allowances',  value: 'sesuai kebijakan perusahaan' },
        { label: 'Cuti tahunan',           value: '16 hari · cuti khusus' },
        { label: 'Masa percobaan',         value: '3 bulan · kontrak PKWTT setelahnya' },
      ],
      validUntilNote: 'Penawaran ini berlaku hingga 19 Maret 2024, 23:59 WIB.',
      closing: 'Mohon konfirmasi penerimaan Anda melalui portal kandidat atau balas email ini. Kami sangat menantikan Anda bergabung dengan tim.',
      approvalChain: [
        { role: 'Recruiter',      name: 'Siti Aisyah',                status: 'drafted',  timestamp: '11 Mar 14:32' },
        { role: 'Hiring Manager', name: 'Rudi Hartono — EM Web',      status: 'approved', timestamp: '11 Mar 17:04' },
        { role: 'Finance',        name: 'Anita Wardhani',             status: 'pending',  timestamp: 'Sent 11 Mar 17:05' },
        { role: 'HRBP Sign-off',  name: 'Lukman Abdullah',            status: 'auto',     timestamp: null },
      ],
      expiryNote: 'Letter auto-expires in 7 days. Candidate gets auto-reminders at day 3 and day 5.',
    },
    activeOffers: [
      { candidate: 'Dewi Sartika',   role: 'Sr. Frontend',    package: 'Rp 32M + 15M SO', status: 'financeApproval', expires: '—'        },
      { candidate: 'Ahmad Rivaldi',  role: 'Marketing Mgr',   package: 'Rp 38M + bonus',  status: 'sentToCandidate', expires: 'in 6 days' },
      { candidate: 'Sari Indrawati', role: 'Data Analyst',    package: 'Rp 24M',          status: 'negotiating',     expires: 'in 4 days' },
      { candidate: 'Yoga Pratama',   role: 'Sr. Backend',     package: 'Rp 34M + 12M SO', status: 'drafting',        expires: '—'        },
      { candidate: 'Rina Nuraini',   role: 'Brand Mgr',       package: 'Rp 36M',          status: 'accepted',        expires: 'Signed'    },
      { candidate: 'Maya Kartika',   role: 'UX Designer',     package: 'Rp 22M',          status: 'hmApproval',      expires: '—'        },
      { candidate: 'Bagas Setiawan', role: 'Growth Analyst',  package: 'Rp 20M',          status: 'declined',        expires: '—'        },
    ],
  },

  contract: {
    candidateName: 'Dewi Sartika',
    contractType: 'PKWTT',
    role: 'Sr. Frontend Dev',
    kpis: [
      { label: 'Active Contracts',  value: '156', sub: 'PKWTT 112 · PKWT 44',     tone: 'emerald', progress: 72 },
      { label: 'Generated This Week', value: '8',  sub: 'Ready for e-sign',        tone: 'emerald' },
      { label: 'Expiring < 30d',    value: '5',   sub: 'PKWT renewals needed',     tone: 'amber'   },
      { label: 'Template Library',  value: '12',  sub: 'Role × entity × region',   tone: 'blue'    },
    ],
    templates: [
      { name: 'PKWTT — Permanent (IC)',         meta: 'Myralix Indonesia · Used 142x · last edit 2mo ago', selected: true  },
      { name: 'PKWTT — Permanent (Lead/Mgr)',   meta: 'Myralix Indonesia · Used 28x · last edit 3mo ago',  selected: false },
      { name: 'PKWT — 12mo fixed-term',         meta: 'Myralix Indonesia · Used 44x · last edit 1mo ago',  selected: false },
      { name: 'PKWT — Project-based',           meta: 'Myralix Digital · Used 12x · last edit 2mo ago',    selected: false },
      { name: 'Internship agreement',           meta: 'Myralix Indonesia · Used 9x · last edit 5mo ago',   selected: false },
    ],
    clauseLibrary: [
      'Probation (3mo)', 'Non-compete (6mo)', 'Non-disclosure', 'IP assignment', 'Remote work policy',
      'Overtime (UU No. 13)', 'Severance (UU No. 6)', 'Data privacy (UU PDP)', 'Dispute resolution (BANI)',
      'Governing law (RI)', 'Confidentiality', 'Background check consent', 'Code of conduct', 'Anti-bribery',
      'Notice (30 days)',
    ],
    legalReview: {
      note: 'External counsel (Assegaf Hamzah) — reviewed 18 Jan 2024',
      nextReview: 'Next review cadence: Oct 2024 (annual) · Alerts route to People Legal Lead',
      status: 'UP TO DATE',
    },
    builder: {
      autoFilledFieldCount: 36,
      sections: [
        { heading: 'Parties & Role', lines: [
          'PT Myralix Indonesia · NPWP 01.234.567.8-012.000',
          'Dewi Sartika · Identity Number 3174...01',
          'Position: Sr. Frontend Developer',
          'Dept: Engineering · Reports to Rudi Hartono',
        ]},
        { heading: 'Compensation', lines: [
          'Base: Rp 32.000.000/mo THP',
          'Sign-on: Rp 15.000.000',
          'Bonus: 20% target · on-target',
          'Allowances: Rp 2.500.000/mo',
        ]},
        { heading: 'Duration & Probation', lines: [
          'Type: PKWTT (permanent)',
          'Start: 15 April 2024',
          'Probation: 3 months',
          'Notice: 30 days after probation',
        ]},
        { heading: 'Benefits', lines: [
          'BPJS Kesehatan + Ketenagakerjaan',
          'THR 1x gross (lebaran)',
          'Annual leave: 16 days + special',
          'Remote: Hybrid (Tue/Thu in office)',
        ]},
        { heading: 'Restrictive Covenants', lines: [
          'NDA: duration of employment + 2y',
          'IP: assigned to employer',
          'Non-compete: 6mo post-exit',
          'Non-solicit: 12mo post-exit',
        ]},
        { heading: 'Termination & Severance', lines: [
          'As per UU No.6/2023 (Ciptakerja)',
          'Minimum 1x uang pesangon (UP)',
          'Grounds: cause / redundancy / mutual',
          'Garden leave allowed (no pay cap)',
        ]},
      ],
    },
  },

  eSignature: {
    summary: 'E-Signature — 1 unit per signed document',
    providerNote: 'Privy.id (primary) · Mekari Sign (backup) · UU ITE compliant · tersertifikasi OJK · audit trail exported to Kemnaker',
    awaitingCount: 6,
    kpis: [
      { label: 'Awaiting Signature', value: '7',   sub: 'Candidates · 2 HRBP', tone: 'amber',   progress: 28 },
      { label: 'Fully Signed',       value: '34',  sub: 'This quarter · 89% in <48h', tone: 'emerald' },
      { label: 'Avg Turnaround',     value: '18h', sub: 'Candidate → HRBP → done',     tone: 'blue'    },
      { label: 'Authentication Fail', value: '1',  sub: 'Privy re-verification needed', tone: 'rose'   },
    ],
    providerLabel: 'Privy.id',
    flow: [
      { label: 'Dispatch',          sub: 'Recruiter →'        },
      { label: 'Candidate auth',    sub: 'Identity Number / e-KTP'        },
      { label: 'Candidate signs',   sub: 'OTP confirmed'      },
      { label: 'HRBP counter-signs', sub: 'Level 1'           },
      { label: 'Director endorses', sub: 'Level 2 (if req)'  },
      { label: 'Onboarding trigger', sub: 'Auto → Step 5'    },
    ],
    tracker: [
      { candidate: 'Dewi Sartika',   contract: 'PKWTT · Sr. Frontend', provider: 'Privy.id',   candidateSign: { status: 'signed',   timestamp: '12 Mar 09:22' }, hrbpSign: { status: 'awaiting', timestamp: '' },         directorSign: { status: 'auto', timestamp: '' },     action: { label: 'Nudge HRBP', variant: 'default' } },
      { candidate: 'Ahmad Rivaldi',  contract: 'PKWTT · Marketing Mgr', provider: 'Privy.id',  candidateSign: { status: 'signed',   timestamp: '11 Mar 17:08' }, hrbpSign: { status: 'signed',   timestamp: '11 Mar 18:44' }, directorSign: { status: 'signed', timestamp: '12 Mar 08:12' }, action: { label: 'PDF', variant: 'outline' } },
      { candidate: 'Sari Indrawati', contract: 'PKWT · Data Analyst',  provider: 'Mekari Sign', candidateSign: { status: 'signed',   timestamp: '10 Mar 14:05' }, hrbpSign: { status: 'signed',   timestamp: '10 Mar 16:20' }, directorSign: { status: 'na', timestamp: 'N/A' },    action: { label: 'PDF', variant: 'outline' } },
      { candidate: 'Yoga Pratama',   contract: 'PKWTT · Sr. Backend',  provider: 'Privy.id',   candidateSign: { status: 'sent',     timestamp: '12 Mar' },       hrbpSign: { status: 'waiting',  timestamp: '' },         directorSign: { status: 'auto', timestamp: '' },     action: { label: 'Remind', variant: 'outline' } },
      { candidate: 'Rina Nuraini',   contract: 'PKWTT · Brand Mgr',    provider: 'Privy.id',   candidateSign: { status: 'signed',   timestamp: '08 Mar 11:00' }, hrbpSign: { status: 'signed',   timestamp: '08 Mar 13:42' }, directorSign: { status: 'signed', timestamp: '09 Mar 10:15' }, action: { label: 'PDF', variant: 'outline' } },
      { candidate: 'Maya Kartika',   contract: 'PKWT · UX Designer',   provider: 'Privy.id',   candidateSign: { status: 'authFailed', timestamp: '' },         hrbpSign: { status: 'waiting',  timestamp: '' },         directorSign: { status: 'na', timestamp: 'N/A' },    action: { label: 'Re-auth', variant: 'destructive' } },
      { candidate: 'Bagas Setiawan', contract: 'Internship',           provider: 'Mekari Sign', candidateSign: { status: 'sent',    timestamp: '12 Mar' },       hrbpSign: { status: 'waiting',  timestamp: '' },         directorSign: { status: 'na', timestamp: 'N/A' },    action: { label: 'Remind', variant: 'outline' } },
    ],
    automations: [
      { icon: Send,        title: 'Send welcome email',       description: 'Immediately after final signature · template "Welcome @ Myralix"' },
      { icon: Workflow,     title: 'Trigger Onboarding workflow', description: 'Create Onboarding record, assign buddy, schedule Day 1' },
      { icon: ListChecks,   title: 'Provision HRIS account',   description: 'Mekari Talenta · Identity Number, TIN, BPJS auto-filled · first-day sync' },
      { icon: Bell,         title: 'Notify hiring manager',    description: 'Email / Slack · with start date + buddy + Day 1 agenda' },
      { icon: RotateCcw,    title: 'Agency commission alert',  description: 'If vendor-sourced, notify Finance of pending commission' },
      { icon: ListChecks,   title: 'Report to Kemnaker',        description: 'Automatic WLK filing for new PKWT / PKWTT employees (monthly)' },
    ],
  },

  offerPipeline: {
    kpis: [
      { label: 'Offers in Flight', value: '22', sub: 'Across 7 active reqs', tone: 'amber'   },
      { label: 'Accepted (Q1)',     value: '41', sub: '87% acceptance rate', tone: 'emerald' },
      { label: 'Negotiating',       value: '3',  sub: 'Avg 1.4 rounds',      tone: 'blue'    },
      { label: 'Declined',          value: '6',  sub: 'Counter was competitive', tone: 'rose' },
    ],
    funnel: [
      { label: 'Package drafted', value: '22', pct: 100 },
      { label: 'Approvals done',  value: '18', pct: 82  },
      { label: 'Offer sent',      value: '15', pct: 68  },
      { label: 'Negotiating',     value: '3',  pct: 14  },
      { label: 'Accepted',        value: '11', pct: 50  },
      { label: 'Signed',          value: '8',  pct: 36  },
    ],
    offers: [
      { candidate: 'Dewi Sartika',   role: 'Sr. Frontend',   stage: 'offerSent',       daysInStage: '2d', daysInStageWarning: false, package: 'Rp 32M + 15M SO', source: 'Direct · LinkedIn',  action: 'view'     },
      { candidate: 'Ahmad Rivaldi',  role: 'Marketing Mgr',  stage: 'signed',          daysInStage: '—',  daysInStageWarning: false, package: 'Rp 38M',         source: 'Michael Page',       action: 'contract' },
      { candidate: 'Sari Indrawati', role: 'Data Analyst',   stage: 'negotiating',     daysInStage: '4d', daysInStageWarning: true,  package: 'Rp 24M → 26M',   source: 'Referral',           action: 'counter'  },
      { candidate: 'Yoga Pratama',   role: 'Sr. Backend',    stage: 'contractSent',    daysInStage: '1d', daysInStageWarning: false, package: 'Rp 34M + 12M SO', source: 'JAC Recruit',       action: 'view'     },
      { candidate: 'Maya Kartika',   role: 'UX Designer',    stage: 'financeApproval', daysInStage: '2d', daysInStageWarning: false, package: 'Rp 22M',         source: 'Direct',             action: 'nudge'    },
      { candidate: 'Rina Nuraini',   role: 'Brand Mgr',      stage: 'signed',          daysInStage: '—',  daysInStageWarning: false, package: 'Rp 36M',         source: 'Robert Walters',     action: 'contract' },
      { candidate: 'Bagas Setiawan', role: 'Growth Analyst', stage: 'declined',        daysInStage: '—',  daysInStageWarning: false, package: 'Rp 20M',         source: 'LinkedIn',           action: 'reason'   },
      { candidate: 'Yanto Kusuma',   role: 'DevOps Eng',     stage: 'hmApproval',      daysInStage: '1d', daysInStageWarning: false, package: 'Rp 30M',         source: 'Internal referral', action: 'nudge'    },
    ],
    declineReasons: [
      { label: 'Counter-offer accepted at current employer', pct: 42 },
      { label: 'Comp below expectations (avg Rp 4.5M gap)',   pct: 28 },
      { label: 'Title / scope not matching ambition',         pct: 14 },
      { label: 'Timing — personal reasons',                   pct: 10 },
      { label: 'Cultural fit concern',                         pct: 6  },
    ],
    aiRecommendation: {
      summary: 'Counter-offer loss is your biggest leak (42%). Three mitigations:',
      mitigations: [
        'Benchmark offers at 65th percentile (currently 55–60th) for high-demand roles — est. +12% offer acceptance.',
        'Shorten offer → signed cycle from 8 days to <5 days. Each extra day adds 4% decline risk.',
        'For senior roles, include a non-compete buyback clause to reduce counter-offer attractiveness.',
      ],
    },
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────────── */

export default function OfferContractPage({ data = offerContractMock }) {
  const [activeStep, setActiveStep] = useState('remuneration');
  const navigate = useNavigate();
  const { job, candidate, remuneration, offerLetter, contract, eSignature, offerPipeline } = data;

  const goTo = (key) => setActiveStep(key);

  return (
    <div className="space-y-5 p-6">

      <JobContextCard job={job} navigate={navigate} />

      <StepRail activeKey={activeStep} onSelect={setActiveStep} />

      {activeStep === 'remuneration' && (
        <RemunerationStep
          data={remuneration}
          candidate={candidate}
          onNext={() => goTo('offerLetter')}
        />
      )}
      {activeStep === 'offerLetter' && (
        <OfferLetterStep
          data={offerLetter}
          onBack={() => goTo('remuneration')}
          onNext={() => goTo('contract')}
        />
      )}
      {activeStep === 'contract' && (
        <ContractStep
          data={contract}
          onBack={() => goTo('offerLetter')}
          onNext={() => goTo('eSignature')}
        />
      )}
      {activeStep === 'eSignature' && (
        <ESignatureStep
          data={eSignature}
          onBack={() => goTo('contract')}
          onNext={() => goTo('pipeline')}
        />
      )}
      {activeStep === 'pipeline' && (
        <OfferPipelineStep
          data={offerPipeline}
          onBack={() => goTo('eSignature')}
        />
      )}

    </div>
  );
}