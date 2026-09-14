import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SkillChips } from '@/components/shared/SkillChips';

export default function EditJobDetailsModal({ open, onOpenChange, job, onSubmit, loading }) {
  const [jobDesc, setJobDesc] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !job) return;
    setJobDesc(job.job_desc || '');
    setQualifications(job.qualifications || '');
    setRequiredSkills(Array.isArray(job.required_skills) ? job.required_skills : []);
    setError('');
  }, [open, job]);

  const onSkillKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    const v = e.target.value.trim();
    if (!v) return;
    e.preventDefault();
    if (!requiredSkills.includes(v)) setRequiredSkills((prev) => [...prev, v]);
    e.target.value = '';
  };
  const removeSkill = (i) => setRequiredSkills((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await onSubmit({
        job_desc: jobDesc.trim() || null,
        qualifications: qualifications.trim() || null,
        required_skills: requiredSkills,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Job Details</DialogTitle>
          <DialogDescription>
            Changes here re-score every candidate on this job — pending and already-scored —
            against the updated description, qualifications, and skills.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto flex-1 px-1">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-jd-desc">Job description</Label>
            <Textarea
              id="edit-jd-desc"
              rows={6}
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-jd-quals">Qualifications</Label>
            <Textarea
              id="edit-jd-quals"
              rows={6}
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Required skills</Label>
            <SkillChips
              values={requiredSkills}
              onRemove={removeSkill}
              onAddKey={onSkillKeyDown}
              placeholder="Type a skill, press Enter"
              tone="primary"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving & queuing re-score…' : 'Save & Re-score All'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
