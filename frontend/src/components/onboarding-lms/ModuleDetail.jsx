import { useState, useEffect } from 'react';
import { ChevronLeft, Play, FileText, Presentation, MessageSquare, Check, Lock, ExternalLink } from 'lucide-react';
import { getModule } from '@/api/portal-onboarding.api';
import { getOnboardingToken } from '@/lib/onboardingPortalAuth';

const CONTENT_ICON = { video: Play, pdf: FileText, slides: Presentation, text: MessageSquare };

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-b-0">
      <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function StatusBadge({ status, t }) {
  const map = {
    done:   { label: t.complete,     className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    active: { label: t.in_progress,  className: 'bg-blue-50 text-blue-700 border-blue-200' },
    todo:   { label: t.not_started,  className: 'bg-muted text-muted-foreground border-transparent' },
    locked: { label: t.locked,       className: 'bg-muted text-muted-foreground border-transparent' },
  };
  const s = map[status] || map.todo;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${s.className}`}>
      {status === 'locked' && <Lock className="h-3 w-3" />}
      {s.label}
    </span>
  );
}

function ContentItem({ item, t }) {
  const Icon = CONTENT_ICON[item.contentType] || FileText;
  const isUploadedFile = !!item.payload?.original_name;
  const isExternalLink = !isUploadedFile && !!item.payload?.source_ref;

  return (
    <div className="flex items-start gap-3 px-6 py-4 border-t">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium mb-1">{item.title}</div>
        {item.contentType === 'text' && item.payload?.body_text && (
          <p className="text-sm text-muted-foreground whitespace-pre-line">{item.payload.body_text}</p>
        )}
        {isExternalLink && (
          <a
            href={item.payload.source_ref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> {t.content_open}
          </a>
        )}
        {isUploadedFile && (
          <div className="text-xs text-muted-foreground italic">
            {item.payload.original_name}
            {/* Download isn't wired up for candidates yet — see note below the component */}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ModuleDetail({ moduleId, t, lang, goTo }) {
  const [module, setModule] = useState(null); // null = loading
  const [error, setError] = useState(null);

  useEffect(() => {
    setModule(null);
    setError(null);
    const token = getOnboardingToken();
    getModule(token, moduleId)
      .then((res) => setModule(res.data.module))
      .catch((err) => setError(err.response?.data?.message || 'Module not found.'));
  }, [moduleId]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24 text-muted-foreground text-sm">
        {error}
      </div>
    );
  }

  if (!module) {
    return <div className="max-w-3xl mx-auto text-center py-24 text-muted-foreground text-sm">…</div>;
  }

  const isDone = module.status === 'done';
  const isLocked = module.status === 'locked';

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
        <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{module.category}</span>
        <StatusBadge status={module.status} t={t} />
      </div>

      <h1 className="font-serif text-3xl mb-6">{module.title}</h1>

      <div className="rounded-xl border bg-card px-6 mb-6">
        {module.durationMin != null && <InfoRow label={t.duration} value={`${module.durationMin} min`} />}
        <InfoRow label={t.category} value={module.category} />
        {module.score != null && <InfoRow label={t.quiz_score} value={`${module.score}%`} />}
      </div>

      {isLocked ? (
        <div className="rounded-xl border bg-card px-6 py-8 text-center text-muted-foreground text-sm">
          {t.locked}
        </div>
      ) : isDone ? (
        <div className="rounded-xl border bg-card px-6 py-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-semibold mb-3">
            <Check className="h-3.5 w-3.5" /> {t.complete}
          </div>
          {module.score != null && (
            <p className="text-sm text-muted-foreground">{t.quiz_score}: {module.score}%</p>
          )}
        </div>
      ) : module.content.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-8 text-center text-muted-foreground text-sm">
          {lang === 'id' ? 'Belum ada materi untuk modul ini.' : 'No content in this module yet.'}
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          {module.content.map((item) => (
            <ContentItem key={item.id} item={item} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}