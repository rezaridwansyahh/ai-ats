import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { JobContextCard } from '@/components/common/JobContextCard';
import { StepRail } from '@/components/onboarding/StepRail';
import { PreBoardingStep } from '@/components/onboarding/PreBoardingStep';
import { DayOneThirtyStep } from '@/components/onboarding/DayOneThirtyStep';
import { ProbationStep } from '@/components/onboarding/ProbationStep';

/* ─────────────────────────────────────────────────────────────────────────────
   DUMMY DATA
   Replace `onboardingMock` with a real fetch later — nothing else changes.
───────────────────────────────────────────────────────────────────────────── */

const onboardingMock = {
  job: {
    id: 'JOB-2148',
    title: 'Sales Executive Management Trainee',
    status: 'Active',
    hired: '4/10',
    deadline: '15 Mar 2026',
    daysOpen: 18,
  },

  candidateName: 'Bagas Pratama',

  preBoarding: {
    startDate: '15 Apr',
    daysUntilStart: 18,
    pctComplete: 86,
    checklist: [
      { label: 'KTP (re-verified vs BG check)',  status: 'done',       owner: 'Candidate' },
      { label: 'NPWP',                            status: 'done',       owner: 'Candidate' },
      { label: 'BPJS Kesehatan number',            status: 'done',       owner: 'Candidate' },
      { label: 'Bank account (Mandiri)',           status: 'done',       owner: 'Candidate' },
      { label: 'Equipment form (laptop preference)', status: 'done',     owner: 'Candidate' },
      { label: 'Emergency contact',                status: 'inProgress', owner: 'Candidate' },
      { label: 'Welcome kit (mug + tote)',          status: 'notStarted', owner: 'IT/Ops' },
    ],
    hrisTask: {
      code: 'T',
      title: 'ON-03 · Push to Talenta HRIS',
      description: 'Creates employee record · provisions email + Slack · syncs to payroll',
      action: 'Push now',
    },
    buddy: {
      code: 'ON-04',
      initials: 'AS',
      name: 'Andi Setiawan',
      meta: 'Platform Squad · 2.4 yrs · Backend',
    },
    schedule: [
      { time: '09:00', activity: 'HR welcome · Diah' },
      { time: '10:00', activity: 'Engineering tour · Andi' },
      { time: '12:00', activity: 'Team lunch · Platform Squad' },
      { time: '14:00', activity: '1:1 with Indra (manager)' },
      { time: '16:00', activity: 'Setup & access · IT' },
    ],
    welcomeMessage: {
      from: 'Indra (MGR)',
      text: 'Halo Bagas! Senang banget akhirnya kamu join Platform Squad. Hari pertama kita santai aja — fokus orientasi & ketemu tim. Buddy kamu Andi udah siap bantu setup. See you on the 15th!',
    },
  },

  dayOneThirty: {
    dayOf: 12,
    totalDays: 30,
    milestonesDone: 8,
    milestonesTotal: 14,
    weeks: [
      {
        title: 'Week 1',
        items: [
          { label: 'Workspace + tooling access', status: 'done' },
          { label: 'Codebase tour',               status: 'done' },
          { label: 'First PR (small)',             status: 'done' },
          { label: '1:1 cadence set',              status: 'done' },
        ],
      },
      {
        title: 'Week 2',
        items: [
          { label: 'Buddy weekly sync',     status: 'done' },
          { label: 'First on-call shadow',  status: 'done' },
          { label: 'Team retro',            status: 'done' },
          { label: 'Goal-setting w/ Indra', status: 'inProgress' },
        ],
      },
      {
        title: 'Week 3–4',
        items: [
          { label: 'Lead a small ticket',       status: 'notStarted' },
          { label: 'First demo',                status: 'notStarted' },
          { label: 'Check-in w/ HR',            status: 'notStarted' },
          { label: 'Probation goals locked',    status: 'notStarted' },
        ],
      },
    ],
    nudge: {
      text: "Goal-setting overdue by 2 days. A reminder is in Indra's inbox.",
    },
  },

  probation: {
    checkins: [
      { code: 'D30', title: '30-day check-in', note: 'Indra: ramped fast on auth service. Strong fundamentals.', status: 'onTrack' },
      { code: 'D60', title: '60-day check-in', note: 'Indra: one missed deadline · context needed. Buddy escalation queued.', status: 'atRisk' },
      { code: 'D90', title: '90-day decision',  note: '—', status: 'awaiting' },
    ],
    cohort: [
      { label: 'Cohort starting Apr 15', value: '4',   sub: '3 on-track · 1 at-risk',  tone: null },
      { label: 'Avg 30-day verdict',      value: '92%', sub: 'on-track across last 12 mo', tone: 'emerald' },
      { label: 'Probation pass rate',     value: '87%', sub: 'L12 cohorts',                tone: null },
    ],
    atRiskNote: '1 at-risk hire requires manager note',
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────────── */

export default function OnboardingPage({ data = null }) {
  const [activeStep, setActiveStep] = useState('preBoarding');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onboardingData, setOnboardingData] = useState(null);

  const navigate = useNavigate();

  // Simulate data fetch (replace with real API call later)
  useEffect(() => {
    const loadOnboardingData = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Replace with real API call
        // const response = await getOnboarding(candidateId);
        // setOnboardingData(response.data);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setOnboardingData(data || onboardingMock);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load onboarding data');
      } finally {
        setLoading(false);
      }
    };

    loadOnboardingData();
  }, [data]);

  const goTo = (key) => setActiveStep(key);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading onboarding data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 max-w-md">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="font-semibold text-lg">Failed to load onboarding data</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!onboardingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">No onboarding data available</p>
        </div>
      </div>
    );
  }

  const { job, candidateName, preBoarding, dayOneThirty, probation } = onboardingData;

  return (
    <div className="space-y-5 p-6">

      <JobContextCard job={job} navigate={navigate} />

      <StepRail activeKey={activeStep} onSelect={setActiveStep} />

      {activeStep === 'preBoarding' && (
        <PreBoardingStep
          data={preBoarding}
          candidateName={candidateName}
          onNext={() => goTo('dayOneThirty')}
        />
      )}
      {activeStep === 'dayOneThirty' && (
        <DayOneThirtyStep
          data={dayOneThirty}
          onNext={() => goTo('probation')}
        />
      )}
      {activeStep === 'probation' && (
        <ProbationStep
          data={probation}
          onBack={() => goTo('dayOneThirty')}
        />
      )}

    </div>
  );
}