import { useEffect, useState } from 'react';
import { Loader2, Check, Plus, X, AlertTriangle, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getRubric, saveRubric } from '@/api/screening.api';
import { FIXED_KEYS, FIXED_META, DEFAULT_RUBRIC, totalWeight } from '@/components/ai-screening/shared';

// Rubric setup lives here (Job → Pipeline & AI) rather than inside the AI
// Screening candidate page — one rubric per job, shared by every candidate
// scored against it, so it belongs with the job's other pipeline config.
export default function RubricEditor({ jobId }) {
  const [rubric, setRubric]     = useState(DEFAULT_RUBRIC);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState(null);
  const [newCriterion, setNewCriterion] = useState('');
  const [newWeight, setNewWeight]       = useState('10');

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getRubric(jobId);
        if (cancelled) return;
        if (res.data?.rubric?.fixed_criteria) {
          setRubric({
            fixed_criteria: { ...DEFAULT_RUBRIC.fixed_criteria, ...res.data.rubric.fixed_criteria },
            custom_criteria: Array.isArray(res.data.rubric.custom_criteria) ? res.data.rubric.custom_criteria : [],
          });
        }
      } catch { /* keep default rubric */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [jobId]);

  const total = totalWeight(rubric);
  const isBalanced = total === 100;

  const setFixedWeight = (key, weight) =>
    setRubric((rb) => ({ ...rb, fixed_criteria: { ...rb.fixed_criteria, [key]: { ...rb.fixed_criteria[key], weight } } }));

  const addCustom = () => {
    const d = newCriterion.trim();
    const w = Number(newWeight) || 0;
    if (!d) return;
    setRubric((rb) => ({ ...rb, custom_criteria: [...(rb.custom_criteria || []), { description: d, weight: w }] }));
    setNewCriterion('');
    setNewWeight('10');
  };

  const removeCustom = (idx) =>
    setRubric((rb) => ({ ...rb, custom_criteria: (rb.custom_criteria || []).filter((_, i) => i !== idx) }));

  const setCustomWeight = (idx, weight) =>
    setRubric((rb) => ({ ...rb, custom_criteria: (rb.custom_criteria || []).map((c, i) => (i === idx ? { ...c, weight } : c)) }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveRubric(jobId, rubric);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save rubric');
    } finally {
      setSaving(false);
    }
  };

   if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" /> AI Matching Rubric
          <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full ${
            isBalanced ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {total} / 100
          </span>
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Every candidate scored against this job uses these weights. Changes flag previously-scored candidates as stale.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isBalanced && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Weights should total 100 (currently {total}).
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-xs text-red-600">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        <div className="space-y-3">
          {FIXED_KEYS.map((key) => {
            const meta = FIXED_META[key];
            const Icon = meta.icon;
            const weight = Number(rubric.fixed_criteria[key]?.weight) || 0;
            return (
              <div key={key} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-xs font-semibold truncate">{meta.label}</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-primary shrink-0">{weight}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{meta.description}</p>
                <input
                  type="range"
                  min={0} max={100} step={5}
                  value={weight}
                  onChange={(e) => setFixedWeight(key, Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            );
          })}
        </div>

        {(rubric.custom_criteria || []).length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Custom criteria</p>
            {rubric.custom_criteria.map((c, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border p-2.5">
                <span className="text-xs flex-1 min-w-0 truncate">{c.description}</span>
                <Input
                  type="number"
                  value={c.weight}
                  onChange={(e) => setCustomWeight(i, Number(e.target.value) || 0)}
                  className="h-7 w-16 text-xs"
                />
                <span className="text-[10px] text-muted-foreground">%</span>
                <button type="button" onClick={() => removeCustom(i)} className="text-muted-foreground hover:text-rose-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1 border-t">
          <Input
            value={newCriterion}
            onChange={(e) => setNewCriterion(e.target.value)}
            placeholder="Add custom criterion…"
            className="h-8 text-xs flex-1"
          />
          <Input
            type="number"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            className="h-8 w-16 text-xs"
          />
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={addCustom} disabled={!newCriterion.trim()}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          {saved && (
            <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-700 bg-emerald-50">
              <Check className="h-3 w-3 mr-1" /> Saved
            </Badge>
          )}
          <Button size="sm" className="text-xs" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
            Save Rubric
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
