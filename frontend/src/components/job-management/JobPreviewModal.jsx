import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, Clock, Home } from 'lucide-react';

export default function JobPreviewModal({ open, onOpenChange, job }) {
  if (!job) return null;

  const requiredSkills  = Array.isArray(job.required_skills)  ? job.required_skills  : [];
  const preferredSkills = Array.isArray(job.preferred_skills) ? job.preferred_skills : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Candidate Preview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* ── Header block, mirrors how it'll appear on a job board ── */}
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold break-words">{job.job_title || 'Untitled Position'}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                {job.job_location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {job.job_location}
                  </span>
                )}
                {job.work_type && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {job.work_type}
                  </span>
                )}
                {job.work_option && (
                  <span className="flex items-center gap-1">
                    <Home className="h-3 w-3" /> {job.work_option}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Description ── */}
          {job.job_desc && (
            <div>
              <h4 className="text-[11px] font-bold uppercase text-muted-foreground mb-1.5">
                Job Description
              </h4>
              <p className="text-xs leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
                {job.job_desc}
              </p>
            </div>
          )}

          {/* ── Qualifications ── */}
          {job.qualifications && (
            <div>
              <h4 className="text-[11px] font-bold uppercase text-muted-foreground mb-1.5">
                Responsibilities & Qualifications
              </h4>
              <p className="text-xs leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
                {job.qualifications}
              </p>
            </div>
          )}

          {/* ── Required skills ── */}
          {requiredSkills.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase text-muted-foreground mb-1.5">
                Required
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {requiredSkills.map(s => (
                  <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* ── Preferred skills ── */}
          {preferredSkills.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase text-muted-foreground mb-1.5">
                Preferred
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {preferredSkills.map(s => (
                  <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {!job.job_desc && !job.qualifications && (
            <p className="text-xs text-muted-foreground italic">
              No job description added yet — candidates will only see the title and basic details above.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}