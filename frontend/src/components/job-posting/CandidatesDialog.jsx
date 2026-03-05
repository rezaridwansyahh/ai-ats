import { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Download, FileDown, Search } from 'lucide-react';
import { getCandidatesByJobPostingId, downloadCandidateCv } from '@/api/candidate.api';

const STATUS_COLORS = {
  'Kotak masuk':      'bg-[var(--primary-bg)] text-[var(--primary)]',
  'Prescreen':        'bg-[var(--info-bg)] text-[#1E40AF]',
  'Terpilih':         'bg-[var(--purple-bg)] text-[var(--purple)]',
  'Wawancara':        'bg-[var(--amber-bg)] text-[#A16207]',
  'Penawaran':        'bg-[var(--success-bg)] text-[#16A34A]',
  'Menerima Tawaran': 'bg-[var(--success-bg)] text-[#16A34A]',
  'Tidak cocok':      'bg-[var(--error-bg)] text-[#9A3412]',
};

const COLUMNS = ['#', 'Name', 'Status', 'Last Position', 'Address', 'Education', 'CV'];

export function CandidatesDialog({ open, onOpenChange, posting }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');

  const filtered = useMemo(() => {
    if (!search) return candidates;
    const q = search.toLowerCase();
    return candidates.filter((c) =>
      c.name?.toLowerCase().includes(q) ||
      c.candidate_status?.toLowerCase().includes(q) ||
      c.last_position?.toLowerCase().includes(q)
    );
  }, [candidates, search]);

  const handleViewCv = async (candidate) => {
    try {
      const { data } = await downloadCandidateCv(candidate.id);
      const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to view CV:', err);
    }
  };

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

  const handleExportCsv = () => {
    const escape = (val) => {
      const str = String(val ?? '');
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const header = 'Name,Status,Last Position,Address,Education';
    const rows = candidates.map((c) =>
      [c.name, c.candidate_status, c.last_position, c.address, c.education].map(escape).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${posting?.job_title || 'candidates'}-candidates.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!open || !posting) return;
    setCandidates([]);
    setSearch('');
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
            {posting?.job_title} — {loading ? 'Loading…' : search ? `${filtered.length} of ${candidates.length} candidate${candidates.length !== 1 ? 's' : ''}` : `${candidates.length} candidate${candidates.length !== 1 ? 's' : ''}`}
          </DialogDescription>
        </DialogHeader>

        {!loading && candidates.length > 0 && (
          <div className="flex items-center gap-2 -mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, status, or position..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-1 shrink-0" onClick={handleExportCsv}>
              <FileDown className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        )}

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
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No candidates match your search.</p>
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
                <TableHead className="w-20 text-center">CV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c, i) => (
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
                      <div className="flex items-center justify-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="View CV"
                          onClick={() => handleViewCv(c)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Download CV"
                          onClick={() => handleDownloadCv(c)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
