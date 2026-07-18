import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobContextCard } from '@/components/common/JobContextCard';
import { SplitRailHeader, StepRail } from '@/components/medical-assessment/shared';
import { ConfigureStep } from '@/components/medical-assessment/ConfigureStep';
import { ScheduleStep } from '@/components/medical-assessment/ScheduleStep';
import { ExamineStep } from '@/components/medical-assessment/ExamineStep';
import { ReviewStep } from '@/components/medical-assessment/ReviewStep';
import { DecideStep } from '@/components/medical-assessment/DecideStep';
import { PageHeader } from '@/components/common';


/* ─────────────────────────────────────────────────────────────────────────────
   DUMMY DATA
   No backend exists yet for Medical Assessment (no model/controller/API).
   Replace `medicalAssessmentMock` with a real fetch once one is built —
   nothing else in this file needs to change.
───────────────────────────────────────────────────────────────────────────── */

const medicalAssessmentMock = {
  job: {
    id: 'JOB-2148',
    title: 'Sales Executive Management Trainee',
    status: 'Active',
    hired: '4/10',
    deadline: '15 Mar 2026',
    daysOpen: 18,
  },

  splitRail: {
    psych: {
      title: 'Psych Assessment',
      slaLabel: 'SLA 72h · current 36h',
      flow: 'Battery picker → Invite → In progress → Auto-scored → Reviewed. Routes via Manager Inbox when score < 40 on any sub-scale.',
      rejectRoute: 'Reject route: Recovery Hub (silver pool, 90-day cool-off).',
    },
    medical: {
      title: 'Medical Assessment',
      slaLabel: 'SLA 5d · current 18h',
      flow: 'Booking → Clinic visit → Result returned → HR review → Cleared. Results stored in privacy lane; only Cleared/Hold flag visible to recruiter.',
      rejectRoute: 'Reject route: Withdrawal · medical (separate from Psych — UU 13/2003 & Permenkes 56).',
    },
  },

  steps: [
    { key: 'configure', label: 'Configure', sub: 'MCU package' },
    { key: 'schedule',  label: 'Schedule',  sub: '3 booked' },
    { key: 'examine',   label: 'Examine',   sub: '2 in clinic' },
    { key: 'review',    label: 'Review',    sub: '2 awaiting Dr.' },
    { key: 'decide',    label: 'Decide',    sub: 'verdicts pending' },
  ],

  configure: {
    heading: 'Configure · MCU package',
    subtitle: 'Pick the MCU package per role-level. Specialist & Executive get extended cardiac + tox panels.',
    packages: [
      { name: 'Standard MCU',  tier: 'Operasional',           items: ['BP', 'BMI', 'Vision', 'Audio', 'Urine'],            price: 'IDR 280k', duration: '45 min' },
      { name: 'Extended MCU',  tier: 'Specialist + Supervisor', items: ['+ ECG', '+ Liver panel', '+ Chest X-ray'],        price: 'IDR 720k', duration: '90 min' },
      { name: 'Executive MCU', tier: 'Executive',              items: ['+ Cardiac stress', '+ Tox panel', '+ Endoscopy opt.'], price: 'IDR 1.8M', duration: 'half day' },
    ],
    footerLeft: '3 packages active across this cohort',
  },

  schedule: {
    heading: 'Schedule · Clinic bookings',
    subtitle: '3 candidates booked across 2 partner clinics. SMS reminder 24h prior.',
    bookings: [
      { candidate: 'Bagas Pratama', package: 'Extended',  clinic: 'RS Premier Bintaro',      when: 'Tomorrow 08:00', status: 'confirmed' },
      { candidate: 'Maya Sari',     package: 'Executive', clinic: 'RSPI Sulianti',            when: 'Wed 09:30',      status: 'confirmed' },
      { candidate: 'Rina Putri',    package: 'Standard',  clinic: 'Klinik Pratama Surabaya',  when: 'Thu 10:00',      status: 'confirmed' },
    ],
    footerLeft: '3 of 3 booked',
  },

  examine: {
    heading: 'Examine · 2 in clinic now',
    subtitle: 'Real-time intake from partner clinic. Diagnostic values gated by privacy banner.',
    privacyNote: 'Data medis hanya dapat dilihat oleh dokter penyelia. Lab values + clinical findings hidden behind Reveal; every reveal is logged.',
    candidates: [
      { name: 'Bagas Pratama', meta: 'Extended · Done in ~30 min', status: 'In exam', values: [
        { label: 'BP', value: '120/80' }, { label: 'BMI', value: '22.4' }, { label: 'Pulse', value: '76 bpm' },
      ]},
      { name: 'Rina Putri', meta: 'Standard · In progress', status: 'In exam', values: [
        { label: 'BP', value: '118/76' }, { label: 'BMI', value: '21.1' }, { label: 'Pulse', value: '80 bpm' },
      ]},
    ],
    footerLeft: 'Bagas exam in progress · Rina arrived 09:55',
  },

  review: {
    heading: 'Review · Doctor sign-off',
    subtitle: 'Supervising physician reviews findings & writes the medical clearance. Recruiters see only verdict, not values.',
    privacyNote: 'Data medis hanya dapat dilihat oleh dokter penyelia. Lab values + clinical findings hidden behind Reveal; every reveal is logged.',
    rows: [
      { candidate: 'Bagas Pratama', findings: 'All panels within normal range. No flags.',                    reviewer: 'dr. Anwar SpKK', verdict: 'fit' },
      { candidate: 'Rina Putri',    findings: 'BP slightly elevated (135/88). Recommend recheck in 3 months.', reviewer: 'dr. Saraswati',  verdict: 'fitWithNote' },
    ],
    footerLeft: '2 awaiting Dr. review',
  },

  decide: {
    heading: 'Decide · Medical clearance',
    subtitle: 'Verdict roll-up. Hold = conditional clearance with note. Fail routes to Recovery Hub.',
    cleared:     { count: 2, names: 'Bagas P., Maya S.' },
    conditional: { count: 1, note: 'Rina P. — minor BP note' },
    unfit:       { count: 0, note: '—' },
    statusPill: 'All cleared to advance',
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────────── */

export default function MedicalAssessmentPage({ data = medicalAssessmentMock }) {
  const [activeStep, setActiveStep] = useState('configure');
  const navigate = useNavigate();

  const { job, splitRail, steps, configure, schedule, examine, review, decide } = data;

  const goTo = (key) => setActiveStep(key);

  return (
    <div className="space-y-5 p-6">
        <PageHeader
            title="Medical"
            highlight="Assessment"
            subtitle="MCU packages, clinic scheduling, and doctor sign-off — privacy-gated results with full audit trail."
        />
      <JobContextCard job={job} navigate={navigate} />

      <SplitRailHeader psych={splitRail.psych} medical={splitRail.medical} />

      <StepRail steps={steps} activeKey={activeStep} onSelect={goTo} />

      {activeStep === 'configure' && (
        <ConfigureStep data={configure} onNext={() => goTo('schedule')} />
      )}
      {activeStep === 'schedule' && (
        <ScheduleStep data={schedule} onNext={() => goTo('examine')} />
      )}
      {activeStep === 'examine' && (
        <ExamineStep data={examine} onNext={() => goTo('review')} />
      )}
      {activeStep === 'review' && (
        <ReviewStep data={review} onNext={() => goTo('decide')} />
      )}
      {activeStep === 'decide' && (
        <DecideStep
          data={decide}
          onSendToCandidate={() => {}}
          onAdvance={() => navigate('/selection/background-check')}
        />
      )}

    </div>
  );
}