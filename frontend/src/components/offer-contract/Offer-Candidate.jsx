import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/batteries';

import { StepRail } from '@/components/offer-contract/StepRail';
import { RemunerationStep } from '@/components/offer-contract/RemunerationStep';
import { OfferLetterStep } from '@/components/offer-contract/OfferLetterStep';
import { ContractStep } from '@/components/offer-contract/ContractStep';
import { ESignatureStep } from '@/components/offer-contract/ESignatureStep';
import { OfferPipelineStep } from '@/components/offer-contract/OfferPipelineStep';

import offerAPI from '@/api/offer.api';

/* ─────────────────────────────────────────────────────────────────────────────
   MOCK DATA FALLBACK
   ✅ REMUNERATION STEP: Now wired to real API (offer_compensation table)
   ⚠️ Other steps still use mock data (offerLetter, contract, eSignature, pipeline)

   Mock data below is used as fallback for:
   - KPIs/metrics (until we build stats aggregation)
   - Offer Letter workflow (until letter generation is built)
   - Contract PDF generation (until puppeteer template is ready)
   - E-Signature flow (until DocuSign/similar integration)
   - Pipeline step (until onboarding bridge is built)
───────────────────────────────────────────────────────────────────────────── */
const offerContractMock = {
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
      'At Rp 32M base (62nd percentile), this offer is competitive vs market. Sign-on covers notice-period gap.',
    commissionTracker: [
      { vendor: 'KellyPerm Advisors', candidate: 'Dewi Sartika', role: 'Sr. Frontend', terms: '20% × THP × 3mo',  amount: 'Rp 19.200.000', invoiceStatus: 'awaiting', action: 'Pending start' },
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
    activeOffers: [],
  },

  contract: {
    contractType: 'PKWTT',
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
          'Position, dept, and reporting line auto-filled from job data',
        ]},
        { heading: 'Compensation', lines: [
          'Base, sign-on, bonus, allowances auto-filled from Build step',
        ]},
        { heading: 'Duration & Probation', lines: [
          'Type, start date, probation, notice period',
        ]},
        { heading: 'Benefits', lines: [
          'BPJS Kesehatan + Ketenagakerjaan, THR, annual leave, remote policy',
        ]},
        { heading: 'Restrictive Covenants', lines: [
          'NDA, IP assignment, non-compete, non-solicit',
        ]},
        { heading: 'Termination & Severance', lines: [
          'As per UU No.6/2023 (Ciptakerja)',
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
      { label: 'Candidate auth',    sub: 'NIK / e-KTP'        },
      { label: 'Candidate signs',   sub: 'OTP confirmed'      },
      { label: 'HRBP counter-signs', sub: 'Level 1'           },
      { label: 'Director endorses', sub: 'Level 2 (if req)'  },
      { label: 'Onboarding trigger', sub: 'Auto → Step 5'    },
    ],
    tracker: [],
    automations: [],
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
    offers: [],
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

const STATUS_TONE = {
  draft:       'border-slate-300 text-slate-700 bg-slate-50',
  sent:        'border-blue-300 text-blue-700 bg-blue-50',
  negotiating: 'border-amber-300 text-amber-700 bg-amber-50',
  accepted:    'border-emerald-300 text-emerald-700 bg-emerald-50',
  rejected:    'border-rose-300 text-rose-700 bg-rose-50',
  expired:     'border-gray-300 text-gray-500 bg-gray-50',
};

export default function OfferCandidatePage() {
  const navigate           = useNavigate();
  const { offerId: param } = useParams();
  const offerId            = param ? Number(param) : null;

  const [offer, setOffer]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [activeStep, setActiveStep] = useState('remuneration');

  const load = useCallback(async () => {
    if (!offerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await offerAPI.getOfferById(offerId);
      setOffer(res.data || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load offer');
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !offer) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      </div>
    );
  }

  if (!offer) return null;

  // Transform compensation data from API to RemunerationStep format
  const remunerationData = offer.base_salary ? {
    offerBuild: [
      { label: 'Base monthly (THP)', value: `Rp ${Number(offer.base_salary || 0).toLocaleString('id-ID')}`, meta: '/mo' },
      ...(offer.allowances?.transport ? [{ label: 'Tunjangan Transport', value: `Rp ${Number(offer.allowances.transport).toLocaleString('id-ID')}`, meta: '/mo' }] : []),
      ...(offer.allowances?.meal ? [{ label: 'Tunjangan Makan', value: `Rp ${Number(offer.allowances.meal).toLocaleString('id-ID')}`, meta: '/mo' }] : []),
      ...(offer.allowances?.health ? [{ label: 'Tunjangan Kesehatan', value: `Rp ${Number(offer.allowances.health).toLocaleString('id-ID')}`, meta: '/mo' }] : []),
      ...(offer.bonus_structure?.annual ? [{ label: 'Bonus Tahunan', value: `Rp ${Number(offer.bonus_structure.annual).toLocaleString('id-ID')}`, meta: 'annual' }] : []),
      { label: 'BPJS Kesehatan', value: `Rp ${Number(offer.bpjs_kesehatan || 0).toLocaleString('id-ID')}`, meta: '/mo' },
      { label: 'BPJS Ketenagakerjaan', value: `Rp ${Number(offer.bpjs_ketenagakerjaan || 0).toLocaleString('id-ID')}`, meta: '/mo' },
    ],
    salarySlip: {
      month: 'Month 1 Preview',
      currency: 'Rp',
      earnings: [
        { label: 'Gaji Pokok (Base)', amount: Number(offer.base_salary || 0) },
        ...(offer.allowances?.transport ? [{ label: 'Tunjangan Transport', amount: Number(offer.allowances.transport) }] : []),
        ...(offer.allowances?.meal ? [{ label: 'Tunjangan Makan', amount: Number(offer.allowances.meal) }] : []),
        ...(offer.allowances?.health ? [{ label: 'Tunjangan Kesehatan', amount: Number(offer.allowances.health) }] : []),
      ],
      deductions: [
        { label: 'BPJS Kesehatan (1%)', amount: -Number(offer.bpjs_kesehatan || 0) },
        { label: 'BPJS Ketenagakerjaan', amount: -Number(offer.bpjs_ketenagakerjaan || 0) },
        { label: 'PPh 21', amount: -Number(offer.pph21 || 0) },
      ],
      footnote: 'Estimasi berdasarkan calculation_metadata — final ditetapkan oleh Finance',
    },
    totalAnnualPackage: `Rp ${Number(offer.gross_salary || 0).toLocaleString('id-ID')}`,
    aiInsight: offer.calculation_metadata?.notes || 'Kompensasi telah dihitung sesuai aturan DJP 2026.',
    // Keep mock data for metrics/benchmark until we have real stats
    ...offerContractMock.remuneration,
    // Override with real data
    offerBuild: [
      { label: 'Base monthly (THP)', value: `Rp ${Number(offer.base_salary || 0).toLocaleString('id-ID')}`, meta: '/mo' },
      ...(offer.allowances?.transport ? [{ label: 'Tunjangan Transport', value: `Rp ${Number(offer.allowances.transport).toLocaleString('id-ID')}`, meta: '/mo' }] : []),
      ...(offer.allowances?.meal ? [{ label: 'Tunjangan Makan', value: `Rp ${Number(offer.allowances.meal).toLocaleString('id-ID')}`, meta: '/mo' }] : []),
      ...(offer.allowances?.health ? [{ label: 'Tunjangan Kesehatan', value: `Rp ${Number(offer.allowances.health).toLocaleString('id-ID')}`, meta: '/mo' }] : []),
      ...(offer.bonus_structure?.annual ? [{ label: 'Bonus Tahunan', value: `Rp ${Number(offer.bonus_structure.annual).toLocaleString('id-ID')}`, meta: 'annual' }] : []),
      { label: 'BPJS Kesehatan', value: `Rp ${Number(offer.bpjs_kesehatan || 0).toLocaleString('id-ID')}`, meta: '/mo' },
      { label: 'BPJS Ketenagakerjaan', value: `Rp ${Number(offer.bpjs_ketenagakerjaan || 0).toLocaleString('id-ID')}`, meta: '/mo' },
      { label: 'Gross Salary', value: `Rp ${Number(offer.gross_salary || 0).toLocaleString('id-ID')}`, meta: '/mo' },
      { label: 'Net Salary (THP)', value: `Rp ${Number(offer.net_salary || 0).toLocaleString('id-ID')}`, meta: '/mo' },
    ],
    salarySlip: {
      month: 'Month 1 Preview',
      currency: 'Rp',
      earnings: [
        { label: 'Gaji Pokok (Base)', amount: Number(offer.base_salary || 0) },
        ...(offer.allowances?.transport ? [{ label: 'Tunjangan Transport', amount: Number(offer.allowances.transport) }] : []),
        ...(offer.allowances?.meal ? [{ label: 'Tunjangan Makan', amount: Number(offer.allowances.meal) }] : []),
        ...(offer.allowances?.health ? [{ label: 'Tunjangan Kesehatan', amount: Number(offer.allowances.health) }] : []),
      ],
      deductions: [
        { label: 'BPJS Kesehatan', amount: -Number(offer.bpjs_kesehatan || 0) },
        { label: 'BPJS Ketenagakerjaan', amount: -Number(offer.bpjs_ketenagakerjaan || 0) },
        { label: 'PPh 21', amount: -Number(offer.pph21 || 0) },
      ],
      footnote: 'Estimasi berdasarkan calculation_metadata — final ditetapkan oleh Finance',
    },
  } : offerContractMock.remuneration;

  return (
    <>
      {/* Sticky header — real data */}
      <div className="sticky top-[52px] z-10 bg-background/95 backdrop-blur-sm -mt-5 -mx-5 px-5 pt-5 pb-4 border-b border-border/60">
        <div className="space-y-3">
          <Button
            variant="ghost" size="sm" className="text-xs -ml-2 w-fit"
            onClick={() => navigate(`/selection/offer-contract/job/${offer.job_id}`)}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to position
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 text-sm">
              {getInitials(offer.candidate_name || '?')}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold tracking-tight truncate">
                {offer.candidate_name || `Candidate #${offer.candidate_id}`}
              </h1>
              <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                <span>{offer.position_title || offer.job_title}</span>
                <span>· {offer.contract_type}</span>
              </div>
            </div>
            <Badge variant="outline" className={`text-[10px] shrink-0 ${STATUS_TONE[offer.offer_status] || 'border-border text-muted-foreground'}`}>
              <FileText className="h-3 w-3 mr-1" />
              {offer.offer_status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4 space-y-5">

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <StepRail activeKey={activeStep} onSelect={setActiveStep} />

        {activeStep === 'remuneration' && (
          <RemunerationStep
            data={remunerationData}
            candidate={{ name: offer.candidate_name, role: offer.position_title, location: offer.job_location }}
            onNext={() => setActiveStep('offerLetter')}
          />
        )}
        {activeStep === 'offerLetter' && (
          <OfferLetterStep
            data={offerContractMock.offerLetter}
            onBack={() => setActiveStep('remuneration')}
            onNext={() => setActiveStep('contract')}
          />
        )}
        {activeStep === 'contract' && (
          <ContractStep
            data={{ ...offerContractMock.contract, candidateName: offer.candidate_name, role: offer.position_title }}
            onBack={() => setActiveStep('offerLetter')}
            onNext={() => setActiveStep('eSignature')}
          />
        )}
        {activeStep === 'eSignature' && (
          <ESignatureStep
            data={offerContractMock.eSignature}
            onBack={() => setActiveStep('contract')}
            onNext={() => setActiveStep('pipeline')}
          />
        )}
        {activeStep === 'pipeline' && (
          <OfferPipelineStep
            data={offerContractMock.offerPipeline}
            onBack={() => setActiveStep('eSignature')}
          />
        )}

      </div>
    </>
  );
}