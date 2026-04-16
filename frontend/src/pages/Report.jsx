import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { TablePagination } from '@/components/shared/TablePagination';
import { useSort } from '@/hooks/useSort';
import { getAssessmentResults } from '@/api/assessment-result.api';
import { RefreshCw, Search, Users, Trophy, TrendingUp } from 'lucide-react';

const MAX_SCORE = 100;

export default function ReportPage() {
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { toggle, apply, SortIcon } = useSort();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getAssessmentResults();
      setResults(data.results || []);
    } catch {
      setError('Gagal memuat data hasil asesmen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return results;
    const q = search.toLowerCase();
    return results.filter(
      (r) =>
        r.participant_name?.toLowerCase().includes(q) ||
        r.participant_email?.toLowerCase().includes(q)
    );
  }, [results, search]);

  const sorted     = apply(filtered);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated  = sorted.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => {
    if (results.length === 0) return { total: 0, avg: 0, highest: 0 };
    const scores  = results.map((r) => r.score);
    const avg     = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const highest = Math.max(...scores);
    return { total: results.length, avg, highest };
  }, [results]);

  const formatDate = (iso) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const scoreBadge = (score) => {
    const pct = (score / MAX_SCORE) * 100;
    if (pct >= 80) return 'bg-green-100 text-green-700 border-green-200';
    if (pct >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Report</h1>
          <p className="text-sm text-muted-foreground">Hasil asesmen seluruh peserta.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Peserta', value: stats.total, icon: Users, color: '#0A6E5C' },
          { label: 'Rata-rata Skor', value: stats.avg, icon: TrendingUp, color: '#D97706' },
          { label: 'Skor Tertinggi', value: stats.highest, icon: Trophy, color: '#2563EB' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Hasil Asesmen</CardTitle>
              <CardDescription className="text-xs">Daftar peserta dan skor mereka.</CardDescription>
            </div>
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau email..."
                className="pl-8 h-8 text-xs"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-10 text-sm text-red-500">{error}</div>
          ) : loading ? (
            <div className="text-center py-10 text-sm text-muted-foreground">Memuat data...</div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">Belum ada data hasil asesmen.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggle('participant_name')}>
                      <span className="flex items-center gap-1">Nama <SortIcon field="participant_name" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggle('participant_email')}>
                      <span className="flex items-center gap-1">Email <SortIcon field="participant_email" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggle('score')}>
                      <span className="flex items-center gap-1">Skor <SortIcon field="score" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggle('created_at')}>
                      <span className="flex items-center gap-1">Tanggal <SortIcon field="created_at" /></span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((r, i) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-muted-foreground text-xs">
                        {(page - 1) * pageSize + i + 1}
                      </TableCell>
                      <TableCell className="font-medium">{r.participant_name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.participant_email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${scoreBadge(r.score)}`}>
                          {r.score} / {MAX_SCORE}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatDate(r.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <TablePagination
                page={page}
                totalPages={totalPages}
                totalItems={sorted.length}
                pageSize={pageSize}
                setPage={setPage}
                setPageSize={setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
