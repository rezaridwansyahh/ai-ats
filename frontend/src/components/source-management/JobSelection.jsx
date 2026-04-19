import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, Loader2, Pencil, Trash2, Upload, Sparkles, X, Star, Check,
  Bold, Italic, Underline, List, ListOrdered, Link, Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const STATUS_OPTIONS = ['Active', 'Running'];
const PAGE_SIZE = 5;

export default function JobSelectionStep({ jobs, loading, selectedJob, onSelectJob}) {
  // Search, filter & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = !searchQuery || job.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE);
  const paginatedJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  
  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchQuery, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Job List */}
      <Card>
        <CardHeader className="pb-3 space-y-3">
          <CardTitle className="text-sm">All Jobs</CardTitle>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="max-w-[250px] text-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10">
              {jobs.length === 0 ? 'No jobs created yet. Click "New Job" to get started.' : 'No jobs match your search.'}
            </p>
          ) : (
            <div className="space-y-2">
              {paginatedJobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => (job.status === 'Active') && onSelectJob(selectedJob === job ? null : job)}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    selectedJob === job
                      ? 'ring-2 ring-primary bg-primary/5'
                      : (job.status === 'Active')
                        ? 'hover:bg-muted/30 cursor-pointer'
                        : 'opacity-60'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{job.job_title}</span>
                      <Badge variant="secondary" className={`text-[9px] ${
                        job.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                        job.status === 'Draft' ? 'bg-orange-50 text-orange-600' :
                        job.status === 'Running' ? 'bg-blue-50 text-blue-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {job.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {job.job_location && (
                        <span className="text-[10px] text-muted-foreground">{job.job_location}</span>
                      )}
                      {job.work_type && (
                        <span className="text-[10px] text-muted-foreground">{job.work_type}</span>
                      )}
                      {job.work_option && (
                        <span className="text-[10px] text-muted-foreground">{job.work_option}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              {filteredJobs.length > 0
                ? `Showing ${(page - 1) * PAGE_SIZE + 1}\u2013${Math.min(page * PAGE_SIZE, filteredJobs.length)} of ${filteredJobs.length}`
                : 'No results'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}