import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

import { Briefcase, Wand2, Info, Code2, TrendingUp, GraduationCap } from 'lucide-react';

import { ChartRadarDots } from "@/components/report-candidate/screening/spider-chart";
import { ScoreItem } from '@/components/report-candidate/screening/score-item';

const FIXED_META = {
  skills:            { label: 'Skills',            icon: Code2,        description: 'Match against the required + preferred skills' },
  experience:        { label: 'Experience',        icon: Briefcase,    description: 'Years, role relevance, progression vs seniority' },
  career_trajectory: { label: 'Career Trajectory', icon: TrendingUp,   description: 'Tenure pattern, stability, growth (validate via Q&A)' },
  education:         { label: 'Education',         icon: GraduationCap,description: 'Degree relevance + school tier vs qualifications' },
};

const FIXED_KEYS = ['skills', 'experience', 'career_trajectory', 'education'];

export default function MatchDetails({ data }) {
  function fmt(d) {
    if (!d) return '—';
    try { return new Date(d).toISOString().slice(0, 10); } catch { return '—'; }
  }

  return (
    <>
      <Card className="py-4 gap-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" /> Match — Result
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className='flex'>
            <div className='w-1/2'>
              <ChartRadarDots 
                data={data.score_data}
              />
            </div>
            <div className='w-1/2 space-y-3'>
              <ScoreItem label="Skills" score={data.score_data.skills_score} />
              <ScoreItem label="Experience" score={data.score_data.experience_score} />
              <ScoreItem label="Trajectory" score={data.score_data.career_trajectory_score} />
              <ScoreItem label="Education" score={data.score_data.education_score} />
              
              <div className="pt-2 mt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Overall Match</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-primary">{data.score_data.overall_score}%</span>
                  </div>
                </div>
              </div>

              {(data.score_data.matched_skills.length > 0 || data.score_data.missing_skills.length > 0) && (
                  <Table className="w-full">
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase">Matched skills</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Missing skills</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="align-top">
                          <div className="flex flex-wrap gap-1">
                            {data.score_data.matched_skills.length === 0 ? <span className="text-[11px] text-muted-foreground italic">—</span> :
                              data.score_data.matched_skills.map((s) => <Badge key={s} variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700">{s}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-wrap gap-1">
                            {data.score_data.missing_skills.length === 0 ? <span className="text-[11px] text-muted-foreground italic">—</span> :
                              data.score_data.missing_skills.map((s) => <Badge key={s} variant="secondary" className="text-[10px] bg-rose-50 text-rose-700">{s}</Badge>)}
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
            </div>
          </div>
          
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" /> Match — fit breakdown
          </CardTitle>
          {data.score_data.id && (
            <span className="text-[10px] text-muted-foreground">
              Scored {fmt(data.score_data.scored_at)}{data.score_data.role_profile ? ` · ${data.score_data.role_profile}` : ''}
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rubric */}
          <div className="space-y-4">
            {/* Role profile */}
            <div>
              <div className="text-[11px] font-medium text-muted-foreground uppercase mb-2">Role profile</div>
              <div className="flex gap-3">
                {[
                  { value: 'experienced', label: 'Experienced', desc: 'Years, role progression, prior responsibilities matter.' },
                  { value: 'fresh_graduate', label: 'Fresh Graduate', desc: 'Lack of senior titles will not penalize. Education weighed higher.' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={true}
                    className={`flex-1 text-left px-4 py-3 rounded-lg border ${
                      data.score_data.role_profile === opt.value ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-xs font-semibold">{opt.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Skills from job */}
            <div className="pt-3 border-t space-y-2">
              <div className="text-[11px] font-medium text-muted-foreground uppercase">Skills (from job)</div>
              <div className="flex flex-wrap gap-1">
                {data.additional_info.required_skills.length === 0 && data.additional_info.preferred_skills.length === 0 && (
                  <span className="text-[10px] text-muted-foreground">None set on this job.</span>
                )}
                {data.additional_info.required_skills.map((s) => (
                  <Badge key={`req-${s}`} className="text-[10px] bg-primary/10 text-primary border-primary/20">{s}</Badge>
                ))}
                {data.additional_info.preferred_skills.map((s) => (
                  <Badge key={`pref-${s}`} variant="secondary" className="text-[10px]">{s}</Badge>
                ))}
              </div>
              <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                <span>The Skills criterion scores against these lists. Running re-scores all candidates of this job.</span>
              </div>
            </div>

            {/* Criteria & weights */}
            <div className="pt-3 border-t space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-medium text-muted-foreground uppercase">Criteria & weights</div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] ${true ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    Total 100%
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">must equal 100%</span>
                </div>
              </div>

              {FIXED_KEYS.map((key) => {
                const meta = FIXED_META[key];
                const Icon = meta.icon;
                const weight = Number(data.score_data?.rubric_snapshot?.fixed_criteria[key]?.weight) || 0;
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold">{meta.label}</span>
                        <span className="text-[10px] text-muted-foreground">{meta.description}</span>
                      </div>
                      <span className="text-xs font-mono font-semibold w-10 text-right">{weight}%</span>
                    </div>
                    <Slider disabled value={[weight]} onValueChange={(v) => setFixedWeight(key, v[0])} min={0} max={100} step={5} />
                  </div>
                );
              })}

              {/* Custom criteria */}
              <div className="pt-3 border-t space-y-3">
                <div className="text-[11px] font-medium text-muted-foreground uppercase">Custom criteria</div>
                {(data.score_data.rubric_snapshot.custom_criteria || []).length === 0 && (
                  <div className="text-[10px] text-muted-foreground italic">No custom criteria.</div>
                )}
                {(data.score_data.rubric_snapshot.custom_criteria || []).map((c, i) => (
                  <div key={i} className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Target className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-xs truncate">{c.description}</span>
                      </div>
                      <span className="text-xs font-mono font-semibold w-10 text-right">{c.weight}%</span>
                      <button onClick={() => removeCustom(i)} className="p-1 hover:bg-rose-50 rounded text-rose-600 transition-colors" type="button">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <Slider disabled value={[c.weight]} onValueChange={(v) => setCustomWeight(i, v[0])} min={0} max={50} step={5} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}