import { Loader2, Users, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { CANDIDATES_PAGE_SIZE } from '../../hooks/use-job-detail';

function scoreTone(score) {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
}

export default function CandidatesCard({ candidates, filters, pagination, onViewCandidate }) {
  const { total: candidateTotal, loading: candidatesLoading, list: candidateList } = candidates;
  const {
    search: candidateSearch, setSearch: setCandidateSearch,
    duration: durationFilter, setDuration: setDurationFilter,
    minScore, setMinScore,
    minSalary: minSalaryInput, setMinSalary: setMinSalaryInput,
    maxSalary: maxSalaryInput, setMaxSalary: setMaxSalaryInput,
    hasActiveSearch: hasActiveCandidateSearch,
    onClear: onClearFilters,
  } = filters;
  const { page: candidatePage, setPage: setCandidatePage, totalPages: candidateTotalPages } = pagination;

  return (
    <Card className="py-4 gap-3">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Candidates
          <span className="text-[10px] font-normal text-muted-foreground">{candidateTotal}</span>
        </CardTitle>

        <div className="flex flex-wrap items-end gap-3 pt-1">
          <div className="w-[130px]">
            <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Name</div>
            <Input
              placeholder="Search candidates..."
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              className="h-8 text-xs font-normal"
            />
          </div>

          <div className="w-[120px]">
            <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Duration</div>
            <Input
              placeholder="e.g. 2 tahun"
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="h-8 text-xs font-normal"
            />
          </div>

          <div className="w-[130px]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">Min Score</div>
              <span className="text-[11px] font-semibold text-primary">{minScore || '0+'}</span>
            </div>
            <Slider
              value={[minScore]}
              onValueChange={(v) => setMinScore(v[0])}
              min={0}
              max={100}
              step={5}
              className="h-8 flex items-center"
            />
          </div>

          <div className="w-[110px]">
            <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Min Salary</div>
            <Input
              type="number"
              placeholder="0"
              value={minSalaryInput}
              onChange={(e) => setMinSalaryInput(e.target.value)}
              className="h-8 text-xs font-normal"
            />
          </div>
          <div className="w-[110px]">
            <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Max Salary</div>
            <Input
              type="number"
              placeholder="No limit"
              value={maxSalaryInput}
              onChange={(e) => setMaxSalaryInput(e.target.value)}
              className="h-8 text-xs font-normal"
            />
          </div>

          {hasActiveCandidateSearch && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[11px] text-muted-foreground"
              onClick={onClearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {candidatesLoading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : candidateList.length === 0 ? (
          <p className="py-8 text-xs text-muted-foreground text-center italic">
            {hasActiveCandidateSearch ? 'No candidates match your search.' : 'No candidates yet.'}
          </p>
        ) : (
          <>
            <Table className="table-fixed w-full">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase pl-6 w-[20%]">Candidate</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase w-[16%]">Position</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase w-[10%]">Duration</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase w-[12%]">Location</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase w-[13%]">Stage</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase w-[11%] text-center">Score</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase w-[18%] pr-6 text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidateList.map((c) => {
                  const jobPosition = c.information?.job_position || {};
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-medium pl-6 truncate" title={c.candidate_name}>
                        {c.candidate_name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate" title={jobPosition.current || c.last_position || ''}>
                        {jobPosition.current || c.last_position || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate" title={jobPosition.duration || ''}>
                        {jobPosition.duration || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate" title={jobPosition.location || ''}>
                        {jobPosition.location || '—'}
                      </TableCell>
                      <TableCell className="truncate">
                        <Badge variant="outline" className="text-[10px]">
                          {c.latest_stage_name || 'Not started'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {!c.information || Object.keys(c.information).length < 1 ? (
                          <Badge variant="outline" className="text-[9px] text-muted-foreground">No CV</Badge>
                        ) : c.match_score == null ? (
                          <Badge variant="outline" className="text-[9px] text-muted-foreground">No Info</Badge>
                        ) : (
                          <Badge className={`text-[10px] font-mono font-bold ${scoreTone(c.match_score)}`}>
                            {c.match_score}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] gap-1"
                          onClick={() => onViewCandidate(c)}
                        >
                          <Eye className="h-3 w-3" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between gap-2 px-6 py-3 border-t">
              <span className="text-[10px] text-muted-foreground">
                {(candidatePage - 1) * CANDIDATES_PAGE_SIZE + 1}–
                {Math.min(candidatePage * CANDIDATES_PAGE_SIZE, candidateTotal)} of {candidateTotal}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={candidatePage <= 1} onClick={() => setCandidatePage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="text-[11px] text-muted-foreground px-1">
                  {candidatePage} / {candidateTotalPages}
                </span>
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={candidatePage >= candidateTotalPages} onClick={() => setCandidatePage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
