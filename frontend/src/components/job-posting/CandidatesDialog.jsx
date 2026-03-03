import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button }   from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download } from 'lucide-react';
import { getCandidatesByJobPostingId, downloadCandidateCv } from '@/api/candidate.api';

const STATUS_COLORS = {
  'Kotak masuk':      'bg-gray-100 text-gray-700',
  'Prescreen':        'bg-blue-100 text-blue-700',
  'Terpilih':         'bg-indigo-100 text-indigo-700',
  'Wawancara':        'bg-amber-100 text-amber-700',
  'Penawaran':        'bg-green-100 text-green-700',
  'Menerima Tawaran': 'bg-emerald-100 text-emerald-700',
  'Tidak cocok':      'bg-red-100 text-red-700',
};

const COLUMNS = ['#', 'Name', 'Status', 'Last Position', 'Address', 'Education', 'CV'];

export function CandidatesDialog({ open, onOpenChange, posting }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const handleDownloadCv = async (candidate) => {
    try {
      const { data } = await downloadCandidateCv(candidate.id);
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${candidate.name}-cv.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download CV:', err);
    }
  };

  useEffect(() => {
    if (!open || !posting) return;
    setCandidates([]);
    setError(null);
    setLoading(true);
    getCandidatesByJobPostingId(posting.id)
      .then(({ data }) => setCandidates(data.candidates || []))
      .catch((err) => setError(err.response?.data?.message || err.message || 'Failed to load candidates'))
      .finally(() => setLoading(false));
  }, [open, posting]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Candidates</DialogTitle>
          <DialogDescription>
            {posting?.job_title} — {loading ? 'Loading…' : `${candidates.length} candidate${candidates.length !== 1 ? 's' : ''}`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                {COLUMNS.map((col, i) => <TableHead key={i}>{col}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {COLUMNS.map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : error ? (
          <p className="py-8 text-center text-sm text-destructive">{error}</p>
        ) : candidates.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No candidates found for this posting.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Position</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Education</TableHead>
                <TableHead className="w-16 text-center">CV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((c, i) => (
                <TableRow key={c.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[c.candidate_status] ?? 'bg-muted text-muted-foreground'}`}>
                      {c.candidate_status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.last_position || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.address || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.education || '—'}</TableCell>
                  <TableCell className="text-center">
                    {c.attachment ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Download CV"
                        onClick={() => handleDownloadCv(c)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
