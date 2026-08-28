import { Play, ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function HomeScreen({ data, t, lang, goTo }) {
  const { MODULES, PHASES } = data;
  const activeMod = MODULES.find(m => m.status === 'active') || MODULES.find(m => m.status === 'todo');
  const recent = MODULES.filter(m => m.status === 'done').slice(-3).reverse();
  const upcoming = MODULES.filter(m => m.status === 'todo').slice(0, 3);
  const totalDone = MODULES.filter(m => m.status === 'done').length;
  const currentPhase = PHASES.find(p => p.status === 'active');
  const phaseModulesAll = MODULES.filter(m => m.phase === currentPhase.id);
  const phaseModulesDone = phaseModulesAll.filter(m => m.status === 'done').length;
  const phasePct = Math.round(phaseModulesDone / phaseModulesAll.length * 100);

  const hour = new Date().getHours();
  const greet = hour < 12 ? t.greet_morning : t.greet_afternoon;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">
          Day 22 · {currentPhase.when}
        </div>
        <h1 className="font-serif text-2xl font-bold">{greet} Maya.</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.hi_today}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Next up card */}
        <div className="lg:col-span-2 border rounded-xl bg-card p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            {t.next_up} · {t.phase} {currentPhase.id} — {currentPhase.when}
          </div>
          <div className="font-serif text-xl font-bold mb-2">
            {lang === 'en' ? activeMod.t_en : activeMod.t_id}
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            {lang === 'en'
              ? "You've watched two of three videos and signed the policy doc. One case-study slide deck remains, then the post-test."
              : 'Anda telah menonton dua dari tiga video dan menandatangani dokumen kebijakan. Tersisa satu deck studi kasus, lalu post-test.'}
          </p>
          <div className="grid grid-cols-3 gap-4 pb-5 mb-5 border-b">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{t.due_in}</div>
              <div className="text-sm font-semibold text-amber-700">3 days · Mar 25</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{t.duration}</div>
              <div className="text-sm font-semibold">~{activeMod.dur} min remaining</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{t.category}</div>
              <div className="text-sm font-semibold">{activeMod.cat}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => goTo('viewer', { moduleId: activeMod.id })}>
              <Play className="h-3.5 w-3.5 mr-1.5" />
              {t.resume}
            </Button>
            <button
              onClick={() => goTo('module', { moduleId: activeMod.id })}
              className="text-sm font-semibold text-foreground hover:underline inline-flex items-center gap-1"
            >
              View module <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <div className="border rounded-xl bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{t.this_week}</span>
              <button onClick={() => goTo('journey')} className="text-xs font-semibold text-foreground hover:underline">See all →</button>
            </div>
            <div className="space-y-1">
              {upcoming.map((m) => (
                <div
                  key={m.id}
                  onClick={() => goTo('module', { moduleId: m.id })}
                  className="flex items-center gap-3 py-2 cursor-pointer hover:bg-muted/40 rounded-lg px-1.5 -mx-1.5"
                >
                  <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{lang === 'en' ? m.t_en : m.t_id}</div>
                    <div className="text-xs text-muted-foreground">{m.cat} · {t.due} {m.due}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-xl bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{t.recent}</span>
              <button onClick={() => goTo('report')} className="text-xs font-semibold text-foreground hover:underline">Report →</button>
            </div>
            <div className="space-y-1">
              {recent.map(m => (
                <div key={m.id} className="flex items-center gap-3 py-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{lang === 'en' ? m.t_en : m.t_id}</div>
                    <div className="text-xs text-muted-foreground">{m.cat} · {m.score}% pass</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-xl bg-muted/30 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-3">{t.buddy}</div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0">
                RW
              </div>
              <div>
                <div className="text-sm font-semibold">Rizky Wijaya</div>
                <div className="text-xs text-muted-foreground">Senior Engineer · Platform team</div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
              {t.message_buddy}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-xl bg-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">{t.stat_days}</div>
          <div className="font-serif text-2xl font-bold">22<span className="text-sm text-muted-foreground font-sans font-normal"> / 184</span></div>
          <div className="text-xs text-muted-foreground mt-1">12% of total track</div>
        </div>
        <div className="border rounded-xl bg-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">{t.stat_done}</div>
          <div className="font-serif text-2xl font-bold">{totalDone}<span className="text-sm text-muted-foreground font-sans font-normal"> / {MODULES.length}</span></div>
          <div className="text-xs text-muted-foreground mt-1">{Math.round(totalDone / MODULES.length * 100)}% complete</div>
        </div>
        <div className="border rounded-xl bg-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">{t.stat_streak}</div>
          <div className="font-serif text-2xl font-bold">6<span className="text-sm text-muted-foreground font-sans font-normal"> days</span></div>
          <div className="text-xs text-muted-foreground mt-1">Last gap: Mar 14 weekend</div>
        </div>
        <div className="border rounded-xl bg-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">{t.stat_phase_pct}</div>
          <div className="font-serif text-2xl font-bold">{phasePct}<span className="text-sm text-muted-foreground font-sans font-normal">%</span></div>
          <div className="text-xs text-muted-foreground mt-1">{phaseModulesDone} of {phaseModulesAll.length} in phase {currentPhase.id}</div>
        </div>
      </div>
    </div>
  );
}