import { useState } from 'react';
import { ChevronLeft, Play, FileText, Presentation, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LMS_DATA } from './mockData';

const CONTENT_ICON = { video: Play, doc: FileText, slides: Presentation };

export default function Viewer({ moduleId, t, lang, goTo }){
  const {ACTIVE_MODULE_CONTENT, TRANSCRIPT} = LMS_DATA;
  const initial = ACTIVE_MODULE_CONTENT.find((c) => c.status === 'active') || ACTIVE_MODULE_CONTENT[0];
  const [currentId, setCurrentId] = useState(initial.id);
  const [watched, setWatched] = useState(new Set(ACTIVE_MODULE_CONTENT.filter(c => c.status === 'done').map(c => c.id)));

  const idx = ACTIVE_MODULE_CONTENT.findIndex((c) => c.id === currentId);
  const item = ACTIVE_MODULE_CONTENT[idx];
  const isLast = idx === ACTIVE_MODULE_CONTENT.length - 1;
  const Icon =  CONTENT_ICON[item.type] || FileText;
  const title = lang === 'id' ? item.title_id : item.title_en;

  const handleNext = () => {
    setWatched((prev) => new Set(prev).add(item.id));
    if(isLast){
      goTo('quiz', {moduleId});
    } else {
      setCurrentId(ACTIVE_MODULE_CONTENT[idx + 1].id);
    }
  };

  return(
    <div className="max-w 5x1 mx-auto pb-12">
      <button 
        onClick={() => goTo('module', {moduleId})}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {t.back_journey}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Main Viewer */}
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase mb-1">
              {item.source}
            </div>
            <h1 className='font-serif text-2x1 font-bold'>{title}</h1>
          </div>

          <div className='rounded-x1 border bg-card overflow-hidden'>
            <div className='aspect-video bg-muted/60 flex flex-col items-center justify-center gap-2'>
              <div className="h-14 w-14 rounded full bg-foreground text-background flex items-center justify-center">
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-xs text-muted-foreground">{item.dur}</span>
            </div>
          </div>

          {item.type === 'video' && (
            <div className="rounded-x1 border bg0card p-5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-3">
                {t.viewer_transcript}
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {TRANSCRIPT.map((line, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-xs text-muted-foreground font-mono w-10 flex-shrink-0 pt-0.5">{line.ts}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleNext}>
              {isLast ? t.viewer_continue : t.viewer_next}
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </div>

        {/* Content list rail */}
        <div className="rounded-x1 border bg-card p-2 h-fit">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground px-2 py-2">
            {t.module_contents}
          </div>
          <div className="space-y-0.5">
            {ACTIVE_MODULE_CONTENT.map((c) => {
              const CIcon = CONTENT_ICON[c.type] || FileText;
              return(
                <button
                  key={c.id}
                  onClick={() => setCurrentId(c.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                    active ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                >
                  {done ? (
                    <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <CIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-xs font-medium truncate flex-1">
                    {lang === 'id' ? c.title_id : c.title_en}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}