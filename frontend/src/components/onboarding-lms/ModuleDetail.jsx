import { ChevronLeft, Play, FileText, Presentation, Check, Lock } from 'lucide-react';
import { LMS_DATA } from './mockData';

const CONTENT_ICON = { video: Play, doc: FileText, slides: Presentation };

function InfoRow({ label, value }){
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-b-0">
      <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

function StatusBadge({ status, t }){
  const map = {
    done: { label: t.complete, className: 'bg-emerald-50 text-emerald-700 border-emerald-200'},
    active: { label: t.in_progress, className: 'bg-blue-50 text-blue-700 border-blue-200'},
    todo: { label: t.not_started, className: 'bg-muted text-muted-foreground border-transparent'},
    locked: { label: t.locked, className: 'bg-muted text-muted-foreground border-transparent'},
  };
  const s = map[status] || map.todo;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wde ${s.className}`}>
      {status === 'locked' && <Lock className='h-3 w-3' />}
      {s.label}
    </span>
  );
}

function ContentSubItem({ item, lang, t}){
  const Icon = CONTENT_ICON[item.type] || FileText;
  const title = lang === 'id' ? item.title_id : item.title_en;
  return (
    <div className="flex items-center gap-3 px-6 py-3 border-t">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground">{item.source}</div>
      </div>
      <span className="text-xs text-muted-foreground w-16 text-right flex-shrink-0">{item.dur}</span>
      {item.status === 'done' ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold flex-shrink-0">
          <Check className="h-3 w-3" /> {t.done}
        </span>
      ) : item.status === 'active' ? (
        <button className="rounded-lg bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 flex-shrink-0">
          {t.resume}
        </button>
      ) : (
        <span className="text-xs text-muted-foreground flex-shrink-0">—</span>
      )}
    </div>
  );
}

function SectionCard({ seq, title, subtitle, right, children}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-4 px-6 py-4">
        <span className="font-serif text-xl text-emerald-700 w-7 flex-shrink-0">{seq}</span>
        <div className="flex-1 min-w-0">
          <div className="font-serif text-base font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}


export default function ModuleDetail({ moduleId, t, lang, goTo }) {
  const { MODULES, ACTIVE_MODULE_CONTENT } = LMS_DATA;
  const mod = MODULES.find((m) => m.id === moduleId);

  if (!mod) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24 text-muted-foreground text-sm">
        Module not found.
      </div>
    );
  }

  const title = lang === 'id' ? mod.t_id : mod.t_en;
  const isActiveModule = mod.status === 'active';
  const isDone = mod.status === 'done';
  const isLocked = mod.status === 'locked';

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <button
        onClick={() => goTo('journey')}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {t.back_journey}
      </button>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{mod.cat}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {t.phase} {mod.phase}
        </span>
        <StatusBadge status={mod.status} t={t} />
      </div>

      <h1 className="font-serif text-3xl mb-6">{title}</h1>

      <div className="rounded-xl border bg-card px-6 mb-6">
        <InfoRow label={t.duration} value={`${mod.dur} min`} />
        <InfoRow label={t.category} value={mod.cat} />
        <InfoRow label={t.due} value={mod.due} />
        {mod.score != null && <InfoRow label={t.quiz_score} value={`${mod.score}%`} />}
      </div>

      {isActiveModule ? (
        <div className="space-y-4">
          <SectionCard
            seq="01"
            title={t.pretest_title}
            subtitle={t.pretest_sub}
            right={
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold flex-shrink-0">
                <Check className="h-3 w-3" /> 60% · {t.done}
              </span>
            }
          />

          <SectionCard
            seq="02"
            title={t.content_title}
            subtitle={`${ACTIVE_MODULE_CONTENT.filter((c) => c.status === 'done').length} / ${ACTIVE_MODULE_CONTENT.length} ${t.done.toLowerCase()} · via SharePoint`}
            right={
              <button
                onClick={() => goTo('viewer', { moduleId })}
                className="rounded-lg bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 flex-shrink-0"
              >
                {t.resume} →
              </button>
            }
          >
            {ACTIVE_MODULE_CONTENT.map((item) => (
              <ContentSubItem key={item.id} item={item} lang={lang} t={t} />
            ))}
          </SectionCard>

          <SectionCard
            seq="03"
            title={t.posttest_title}
            subtitle={t.posttest_sub}
            right={
              <span className="text-xs text-muted-foreground font-medium flex-shrink-0">
                {t.not_started}
              </span>
            }
          />

          <SectionCard
            seq="04"
            title={t.feedback_title}
            subtitle={t.feedback_sub}
            right={
              <span className="text-xs text-muted-foreground font-medium flex-shrink-0">
                {t.not_started}
              </span>
            }
          />
        </div>
      ) : isDone ? (
        <div className="rounded-xl border bg-card px-6 py-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-semibold mb-3">
            <Check className="h-3.5 w-3.5" /> {t.complete}
          </div>
          <p className="text-sm text-muted-foreground">
            {mod.score != null
              ? `${t.quiz_score}: ${mod.score}%`
              : t.quiz_pass_msg}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card px-6 py-8 text-center text-muted-foreground text-sm">
          {isLocked ? t.locked : t.not_started}
        </div>
      )}
    </div>
  );
}