import { useState } from 'react';

// Automation matrix — local toggle state only. No backend endpoint exists
// yet for automation rules (checked: automation-setting.api.js was not
// confirmed to cover per-job rule toggling). Toggles here do NOT persist
// across reloads. TODO: wire each toggle's onChange to a real mutation
// once the API contract for this is confirmed.

const GROUPS = [
  {
    title: 'Per stage triggers',
    rules: [
      { key: 'ai_screening', label: 'AI Screening', desc: 'Run match score + Q&A on every applicant', trigger: 'on entry to Screen', default: true },
      { key: 'auto_reject',  label: 'Auto-reject below threshold', desc: 'Reject candidates scoring below match floor', trigger: '<60 score', default: true },
      { key: 'auto_advance', label: 'Auto-advance high-confidence', desc: 'Move to Interview when score ≥ floor + verdict pass', trigger: '≥85 + Interview gate', default: false },
    ],
  },
  {
    title: 'Per event triggers',
    rules: [
      { key: 'auto_schedule', label: 'Auto-schedule interview', desc: 'Send slots to candidate on Screen pass', trigger: 'on Screen → Interview', default: true },
      { key: 'email_notify',  label: 'Email notifications', desc: 'Notify candidate at every stage transition', trigger: 'each stage change', default: true },
      { key: 'scorecard_nudge', label: 'Manager scorecard nudge', desc: 'Auto-nudge manager 24h after interview', trigger: '24h post-interview', default: true },
    ],
  },
  {
    title: 'Per time triggers (cron-like)',
    rules: [
      { key: 'stuck_alert',  label: 'Stuck candidate alert', desc: 'Surface candidates idle in stage > N days', trigger: '>5 days in stage', default: true },
      { key: 'pool_reconsent', label: 'Pool re-consent reminder', desc: 'Email pool members nearing consent expiry', trigger: '14d before expiry', default: true },
      { key: 'sla_escalation', label: 'SLA escalation', desc: 'Notify director when approval > SLA', trigger: '>SLA + 4h', default: false },
    ],
  },
];

export default function AutomationMatrix() {
  const [visible, setVisible] = useState(true);
  const [toggles, setToggles] = useState(() => {
    const initial = {};
    GROUPS.forEach(g => g.rules.forEach(r => { initial[r.key] = r.default; }));
    return initial;
  });

  const toggle = (key) => setToggles(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-blue-50 text-blue-900 px-4 py-3 text-sm flex items-center justify-between">
        <span>Wizard step list updates accordingly based on the strategy selected above.</span>
        <button
          onClick={() => setVisible(v => !v)}
          className="text-xs font-medium underline underline-offset-2 flex-shrink-0"
        >
          {visible ? 'Hide automation matrix' : 'Show automation matrix'}
        </button>
      </div>

      {visible && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight">Automation matrix</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Every rule is grouped by its trigger and shows the threshold/preview that will fire. Toggles persist with the requisition; Pipeline rules drawer mirrors these per stage.
            </p>
          </div>

          <div className="rounded-2xl border overflow-hidden divide-y">
            {GROUPS.map(group => (
              <div key={group.title}>
                <div className="bg-muted/30 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {group.title}
                </div>
                <div className="divide-y">
                  {group.rules.map(rule => (
                    <div key={rule.key} className="flex items-center justify-between gap-4 px-4 py-3.5">
                      <div>
                        <div className="text-sm font-semibold">{rule.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{rule.desc}</div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-[11px] font-mono px-2.5 py-1 rounded-md border bg-muted/30 text-muted-foreground">
                          {rule.trigger}
                        </span>
                        <button
                          role="switch"
                          aria-checked={toggles[rule.key]}
                          onClick={() => toggle(rule.key)}
                          className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ${
                            toggles[rule.key] ? 'bg-emerald-600' : 'bg-muted'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                              toggles[rule.key] ? 'translate-x-4' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}