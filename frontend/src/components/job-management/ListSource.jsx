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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import { getSources } from '@/api/job-sourcing.api'

const STATUS_COLORS = {
  Draft: 'bg-orange-50 text-orange-600 border-orange-200',
  Active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Running: 'bg-blue-50 text-blue-600 border-blue-200',
  Expired: 'bg-gray-50 text-gray-500 border-gray-200',
  Failed: 'bg-red-50 text-red-500 border-red-200',
  Blocked: 'bg-gray-50 text-gray-500 border-gray-200',
};

const STATUS_OPTIONS = ['linkedin', 'seek', 'internal'];
const PAGE_SIZE = 10;

export default function ListSourceStep({ selectedJob }) {
  const [jobSources, setJobSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filteredSources = useMemo(() => {
    return jobSources.filter(jobSource => {
      const matchesSearch = !searchQuery || jobSource.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || jobSource.status === statusFilter;
      const matchesPlatform = platformFilter === 'all' || jobSource.platform === platformFilter;

      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [jobSources, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredSources.length / PAGE_SIZE);
  const paginatedSources = filteredSources.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchQuery, statusFilter]);

  const fetchJobSource = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSources();
      setJobSources(res.data.postings || []);
    } catch (err) {
      // no-op
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobSource()
  }, [fetchJobSource])

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
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest">STEP 2</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Prerequisite Warning ── */}  
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border-l-[3px] border-amber-400 bg-amber-50/60 text-[11px] text-muted-foreground">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
        <span>
          <strong>Prerequisite:</strong> Please Re-Sync Job Source in : {' '}
          <span className="text-primary font-semibold cursor-pointer underline">Settings &rarr; Integrations</span>{' '}
          to get newest data.
        </span>
      </div>

      {/* Content */}
      <Card>
        <CardHeader className="pb-3 space-y-3">
          <CardTitle className="text-sm">All Source</CardTitle>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search source..."
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
            <TableCaption>A list of All Job Sources.</TableCaption>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSources.map(source => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.job_title}</TableCell>
                  <TableCell>{source.platform}</TableCell>
                  <TableCell>{source.status}</TableCell>
                  <TableCell>{source.last_sync}</TableCell>
                  <TableCell className="text-center"><Button variant='outline'>Re-Sync</Button></TableCell>
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
              {filteredSources.length > 0
                ? `Showing ${(page - 1) * PAGE_SIZE + 1}\u2013${Math.min(page * PAGE_SIZE, filteredSources.length)} of ${filteredSources.length}`
                : 'No results'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Manual CV Card */}
      <Card>
        <CardHeader className="border-b-1">
          <CardTitle>
            Manual CV Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-5">
          <div className="flex flex-col gap-1.5 w-1/2 h-auto">
            <div
              className="flex border-2 border-dashed border-border rounded-lg p-6 bg-muted/30 cursor-pointer hover:border-primary/40 transition-colors h-50 items-center justify-center"
              onClick="" // Not done
              onDragOver={e => e.preventDefault()}
              onDrop="" // Not done
            >
              <div>
                <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs font-semibold">
                  {/* uploadedFile ? uploadedFile.name : 'Drag file here or click to browse'*/}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Upload Source Job Desc: PDF, DOCX, TXT (max 10MB)
                  <br />AI will auto-extract all fields from uploaded document
                </p>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange=""
                />
              </div>
            </div>
          </div>
          <div className="flex w-1/2">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] text-muted-foreground font-semibold">Job Title <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. Senior Frontend Developer"
                value=""
                onChange=""
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] text-muted-foreground font-semibold">Job Title <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. Senior Frontend Developer"
                value=""
                onChange=""
                requiredc
              />
            </div>

            <Button>
              Upload & Queue Parsing
            </Button>
          </div>
            
          </div>
        </CardContent>
        <CardFooter>
          <Button size="sm" onClick={() => navigate(`/sourcing/talent-pool`)}>
            Go to Talent Pool
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}