import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Plus, Loader2, Pencil, Trash2, Upload, Sparkles, X, Star, Check,
  Bold, Italic, Underline, List, ListOrdered, Link, Bot, Briefcase, MapPin,
  AlertTriangle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import { getAll } from '@/api/applicant.api.js';

const STATUS_COLORS = {
  Draft: 'bg-orange-50 text-orange-600 border-orange-200',
  Active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Running: 'bg-blue-50 text-blue-600 border-blue-200',
  Expired: 'bg-gray-50 text-gray-500 border-gray-200',
  Failed: 'bg-red-50 text-red-500 border-red-200',
  Blocked: 'bg-gray-50 text-gray-500 border-gray-200',
};

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ['linkedin', 'seek', 'internal'];


export default function ListCandidateStep({ selectedJob }) {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filteredApplicants = useMemo(() => {
    return applicants.filter(applicant => {
      const matchesSearch = !searchQuery || applicant.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || applicant.status === statusFilter;
      const matchesPlatform = platformFilter === 'all' || applicant.platform === platformFilter;

      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [applicants, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredApplicants.length / PAGE_SIZE);
  const paginatedApplicants = filteredApplicants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchQuery, statusFilter]);

  const fetchApplicant = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAll();
      setApplicants(res.data.applicants || []);
    } catch (err) {
      // no-op
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplicant()
  }, [fetchApplicant])
  
  return (
    <div className="space-y-5">
      {/* ── Section A: Selected Job Banner ── */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">{selectedJob.job_title}</h3>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 ${STATUS_COLORS[selectedJob.status] || ''}`}>
                    {selectedJob.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  {selectedJob.job_location && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedJob.job_location}</span>
                  )}
                  {selectedJob.work_type && <span>{selectedJob.work_type}</span>}
                  {selectedJob.work_option && <span>{selectedJob.work_option}</span>}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest">STEP 4</span>
          </div>
        </CardContent>
      </Card>

      {/* Section B: Selected Threshold */}
      <Card>
        <CardContent>
          <div>Threshold Score for AI Screening CV</div>
          <div className="flex text-center">
            <div className="min-w-30">
              Min: 70 
            </div>
            <Slider
              value={[70, 100]} // still hardcoded
              min={0}
              max={100}
              step={1}
              disabled
            />
            <div className="min-w-30">
              Max: 100
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
        <Card>
          <CardHeader className="pb-3 space-y-3">
            <CardTitle className="text-sm">All Applicant</CardTitle>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Search applicant..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="max-w-[250px] text-xs"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platform</SelectItem>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table className="table-fixed w-full">
              <TableCaption>A list of All Applicants.</TableCaption>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Last Position</TableHead>
                  <TableHead>Education</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedApplicants.map(applicant => (
                  <TableRow key={applicant.id}>
                    <TableCell className="font-medium">{applicant.name}</TableCell>
                    <TableCell>{applicant.address}</TableCell>
                    <TableCell>{applicant.last_position}</TableCell>
                    <TableCell>{applicant.education}</TableCell>
                    <TableCell className="text-center"><Button variant='outline'>Add to Candidate</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                
              </TableFooter>
            </Table>
  
            <div className="flex flex-col items-center gap-2 pt-3 border-t mt-3">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                {(() => {
                  const pages = [];
                  pages.push(1);
                  if (page > 3) pages.push('...');
                  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                    pages.push(i);
                  }
                  if (page < totalPages - 2) pages.push('...');
                  if (totalPages > 1) pages.push(totalPages);
                  return pages.map((p, idx) =>
                    p === '...' ? (
                      <span key={`dots-${idx}`} className="text-xs text-muted-foreground px-1">...</span>
                    ) : (
                      <Button
                        key={p}
                        variant={page === p ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 w-7 text-xs p-0"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    )
                  );
                })()}
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {filteredApplicants.length > 0
                  ? `Showing ${(page - 1) * PAGE_SIZE + 1}\u2013${Math.min(page * PAGE_SIZE, filteredApplicants.length)} of ${filteredApplicants.length}`
                  : 'No results'}
              </span>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}