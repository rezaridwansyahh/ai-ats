import { ChevronRight, FileSignature, FileText, Eye, Download, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StepCard } from './shared';
/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────────────────── */

function KpiCard({ label, value, sub, tone, progress }) {
  const toneClass = {
    emerald: 'text-emerald-600',
    blue:    'text-blue-600',
    amber:   'text-amber-600',
  }[tone] ?? 'text-foreground';

  return (
    <div className="border rounded-xl bg-card p-4">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">{label}</div>
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      {progress != null && (
        <div className="h-1.5 rounded-full bg-muted mt-3 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function TemplateRow({ template, selected }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
      selected ? 'border-emerald-300 bg-emerald-50' : 'border-border hover:bg-muted/40'
    }`}>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{template.name}</span>
          {selected && (
            <Badge variant="outline" className="text-[10px] border-emerald-300 bg-emerald-100 text-emerald-700">
              SELECTED
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{template.meta}</div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button type="button" className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button type="button" className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted">
          <FileSignature className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

function ClauseChip({ label }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border bg-muted/40 text-foreground cursor-grab">
      ⋮⋮ {label}
    </span>
  );
}

function ContractBuilderField({ heading, lines }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">{heading}</div>
      <ul className="space-y-1 text-xs text-foreground">
        {lines.map((line, i) => <li key={i}>• {line}</li>)}
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ContractStep — default export, used by pages/OfferContract.jsx
───────────────────────────────────────────────────────────────────────────── */

export function ContractStep({ data, onBack, onNext }) {
  const { kpis, templates, clauseLibrary, legalReview, builder, candidateName, contractType, role } = data;

  return (
    <StepCard
      icon={FileText}
      title="Contract"
      footerLeft={
        <button type="button" onClick={onBack} className="font-semibold text-foreground hover:underline">
          Back
        </button>
      }
      footerRight={
        <button
          type="button"
          onClick={onNext}
          className="font-semibold text-foreground flex items-center gap-1 hover:underline"
        >
          Next: E-Signature <ChevronRight className="h-3.5 w-3.5" />
        </button>
      }
    >
      <div className="p-6 space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
        </div>

        <div className="border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
            <div className="font-serif font-bold text-foreground">Template library — drag to build contract</div>
            <Button size="sm" variant="outline" className="text-xs">+ New template</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
            <div className="p-4">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
                Standard templates
              </div>
              <div className="space-y-2">
                {templates.map((t) => <TemplateRow key={t.name} template={t} selected={t.selected} />)}
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
                  Clause library — drag to insert
                </div>
                <div className="flex flex-wrap gap-2">
                  {clauseLibrary.map((c) => <ClauseChip key={c} label={c} />)}
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-muted/30">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">
                  Legal review status
                </div>
                <div className="text-xs text-foreground">{legalReview.note}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{legalReview.nextReview}</span>
                  <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700">
                    {legalReview.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
            <div className="font-serif font-bold text-foreground">
              Contract builder — {candidateName} · {contractType} · {role}
            </div>
            <Badge variant="outline" className="text-[10px] border-blue-200 bg-blue-50 text-blue-700">
              AUTO-FILLED · {builder.autoFilledFieldCount} fields
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {builder.sections.map((s) => (
              <ContractBuilderField key={s.heading} heading={s.heading} lines={s.lines} />
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t bg-muted/20">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Preview full contract
            </Button>
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download DOCX
            </Button>
            <Button size="sm" className="text-xs gap-1.5">
              <Send className="h-3.5 w-3.5" /> Generate &amp; send for signing
            </Button>
          </div>
        </div>

      </div>
    </StepCard>
  );
}