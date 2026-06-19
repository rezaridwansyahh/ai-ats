import { useState } from 'react';
import { Card } from '@/components/ui/card';

// ── Static data — swap for API data when backend is ready ──

const ROLE_TABS = [
  {
    id: 'operator',
    label: 'Operator',
    stages: [
      {
        title: 'Foundations',
        day: 'Day 30',
        checklist: [
          '7-day floor orientation completed',
          'Safety induction (K3 certificate) issued',
          'Buddy assigned + first 1:1',
          'Tooling competency check passed',
        ],
        gate: 'Pass safety + tooling. Fail = same-week supervisor review.',
        owner: 'Floor Supervisor',
      },
      {
        title: 'Productivity ramp',
        day: 'Day 60',
        checklist: [
          '60% productivity vs role baseline',
          'Quality defect rate <2%',
          'Attendance ≥95%',
          'Mid-probation manager 1:1',
        ],
        gate: 'Productivity OR quality miss → 30-day improvement plan.',
        owner: 'Section Lead',
      },
      {
        title: 'Conversion gate',
        day: 'Day 90',
        checklist: [
          '90% productivity, defect <1%',
          'Peer & supervisor 360 done',
          'Manager recommendation submitted',
          'HR conversion decision packet built',
        ],
        gate: 'Conversion → PKWTT. Or extend 30d. Or termination per UU 13/2003.',
        owner: 'HRBP',
      },
    ],
  },
  {
    id: 'office-staff',
    label: 'Office Staff',
    stages: [
      {
        title: 'Foundations',
        day: 'Day 30',
        checklist: [
          'IT & systems access provisioned',
          'Role onboarding checklist completed',
          'Manager 1:1 cadence set',
          'Core process shadowing done',
        ],
        gate: 'Pass onboarding checklist. Fail = same-week manager review.',
        owner: 'Direct Manager',
      },
      {
        title: 'Productivity ramp',
        day: 'Day 60',
        checklist: [
          'Owns core deliverables independently',
          'Stakeholder feedback collected',
          'Quality of work meets role rubric',
          'Mid-probation manager 1:1',
        ],
        gate: 'Rubric miss → 30-day improvement plan.',
        owner: 'Direct Manager',
      },
      {
        title: 'Conversion gate',
        day: 'Day 90',
        checklist: [
          'Full role rubric met',
          'Peer & manager 360 done',
          'Manager recommendation submitted',
          'HR conversion decision packet built',
        ],
        gate: 'Conversion → PKWTT. Or extend 30d. Or termination per UU 13/2003.',
        owner: 'HRBP',
      },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    stages: [
      {
        title: 'Foundations',
        day: 'Day 30',
        checklist: [
          'Product & pitch certification passed',
          'CRM & territory setup completed',
          'Shadowed 5+ live calls',
          'Buddy assigned + first 1:1',
        ],
        gate: 'Pass certification. Fail = same-week manager review.',
        owner: 'Sales Manager',
      },
      {
        title: 'Productivity ramp',
        day: 'Day 60',
        checklist: [
          '60% of quota vs ramped target',
          'Pipeline coverage ≥3x quota',
          'Activity metrics met (calls/demos)',
          'Mid-probation manager 1:1',
        ],
        gate: 'Quota OR activity miss → 30-day improvement plan.',
        owner: 'Sales Manager',
      },
      {
        title: 'Conversion gate',
        day: 'Day 90',
        checklist: [
          '90% of quota, pipeline healthy',
          'Peer & manager 360 done',
          'Manager recommendation submitted',
          'HR conversion decision packet built',
        ],
        gate: 'Conversion → PKWTT. Or extend 30d. Or termination per UU 13/2003.',
        owner: 'HRBP',
      },
    ],
  },
];

// ── Stage card ──

function StageCard({ stage }) {
  return (
    <Card className="py-0 gap-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <p className="text-sm font-semibold">{stage.title}</p>
        <span className="text-[10px] font-semibold uppercase tracking-wide bg-foreground text-background rounded px-2 py-0.5">
          {stage.day}
        </span>
      </div>

      <div className="px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Checklist</p>
        <ul className="space-y-1.5">
          {stage.checklist.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <span className="h-3.5 w-3.5 rounded-full border border-input mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-4 pb-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
          Success gate
        </p>
        <div className="rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-900">
          {stage.gate}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Owner: {stage.owner}</p>
      </div>
    </Card>
  );
}

// ── Page ──

export default function ProbationTemplatesSettings() {
  const [activeTab, setActiveTab] = useState(ROLE_TABS[0].id);
  const role = ROLE_TABS.find((r) => r.id === activeTab);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-serif">Probation 30 · 60 · 90</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Probation now ships with 3 role templates — Operator, Office Staff, Sales — each
          defining checklist items, success criteria, and conversion gates at 30 / 60 / 90 days.
          New hires get the right plan auto-applied based on their offer's job class.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2 text-sm transition-colors ${
              activeTab === tab.id
                ? 'font-semibold text-foreground border-b-2 border-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {role.stages.map((stage) => (
          <StageCard key={stage.title} stage={stage} />
        ))}
      </div>
    </div>
  );
}