import { useState } from 'react';
import { Award, Download, X, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LMS_DATA } from './mockData';

function CertModal({ cert, t, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="h-14 w-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
          <Award className="h-6 w-6 text-amber-600" />
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
          {t.cert_modal_l}
        </div>
        <div className="font-serif text-2xl font-bold mb-1">Maya Putri</div>
        <div className="text-sm text-muted-foreground mb-6">
          {t.cert_modal_for} <span className="font-medium text-foreground">{cert.label}</span>
        </div>
        <div className="border-t pt-4 grid grid-cols-2 gap-4 text-left">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">
              {t.cert_modal_signed}
            </div>
            <div className="text-sm font-medium">{cert.date}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">
              {t.cert_modal_id}
            </div>
            <div className="text-sm font-medium font-mono">{cert.id}</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-4">{t.cert_modal_authority}</div>
        <Button className="mt-6 w-full">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          {t.download}
        </Button>
      </div>
    </div>
  );
}

export default function Report({ t, lang, goTo }) {
  const { PHASES, MODULES } = LMS_DATA;
  const [activeCert, setActiveCert] = useState(null);

  const doneModules = MODULES.filter((m) => m.status === 'done');
  const scoredModules = doneModules.filter((m) => m.score != null);
  const donePhases = PHASES.filter((p) => p.status === 'done');
  const avgScore = Math.round(
    scoredModules.reduce((sum, m) => sum + m.score, 0) / scoredModules.length
  );

  const certs = donePhases.map((p) => ({
    key: `phase-${p.id}`,
    label: `${t.phase} ${p.id} — ${p.key}`,
    date: p.range.split('–')[1]?.trim() ?? p.range,
    id: `CERT-P${p.id}-MP2026`,
    type: 'phase',
  }));

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      <div>
        <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase mb-1">
          {t.report_l}
        </div>
        <h1 className="font-serif text-2xl font-bold">
          {t.report_title}<span className="text-emerald-700 italic">{t.report_em}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl">{t.report_sub}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-xl bg-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
            {t.stat_done}
          </div>
          <div className="font-serif text-2xl font-bold">
            {doneModules.length}
            <span className="text-sm text-muted-foreground font-sans font-normal"> / {MODULES.length}</span>
          </div>
        </div>
        <div className="border rounded-xl bg-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
            {t.report_certs}
          </div>
          <div className="font-serif text-2xl font-bold">
            {certs.length}
            <span className="text-sm text-muted-foreground font-sans font-normal"> {t.report_certs_done}</span>
          </div>
        </div>
        <div className="border rounded-xl bg-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
            {t.report_scores}
          </div>
          <div className="font-serif text-2xl font-bold flex items-center gap-1.5">
            {avgScore}%
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
        </div>
        <div className="border rounded-xl bg-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
            {t.stat_days}
          </div>
          <div className="font-serif text-2xl font-bold">
            22<span className="text-sm text-muted-foreground font-sans font-normal"> / 184</span>
          </div>
        </div>
      </div>

      {/* Certificates */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
          {t.report_certs}
        </div>
        {certs.length === 0 ? (
          <div className="border rounded-xl bg-card p-6 text-center text-sm text-muted-foreground">
            {t.not_started}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {certs.map((c) => (
              <div key={c.key} className="border rounded-xl bg-card p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {t.cert_phase}
                  </div>
                  <div className="text-sm font-semibold truncate">{c.label}</div>
                </div>
                <button
                  onClick={() => setActiveCert(c)}
                  className="text-xs font-semibold text-emerald-700 hover:underline flex-shrink-0"
                >
                  {t.view_cert}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz scores table */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
          {t.report_scores}
        </div>
        <div className="border rounded-xl bg-card overflow-hidden">
          {scoredModules.map((m, i) => {
            const title = lang === 'id' ? m.t_id : m.t_en;
            return (
              <div
                key={m.id}
                onClick={() => goTo('module', { moduleId: m.id })}
                className={`flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-muted/40 ${
                  i !== 0 ? 'border-t' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{title}</div>
                  <div className="text-xs text-muted-foreground">{m.cat} · {t.phase} {m.phase}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${m.score >= 70 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                      style={{ width: `${m.score}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-10 text-right">{m.score}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activeCert && <CertModal cert={activeCert} t={t} onClose={() => setActiveCert(null)} />}
    </div>
  );
}