import { useEffect, useState, useCallback } from 'react';
import {
  Loader2, AlertTriangle, Plus, Copy, Check, Eye, Trash2, RotateCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common';

import { getInterviewPacks, deleteInterviewPack } from '@/api/interview-pack.api';
import { CreateInterviewPackDialog } from '@/components/interview-pack/CreateInterviewPackDialog';
import { PackDetailDialog } from '@/components/interview-pack/PackDetailDialog';

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

function StatusBadge({ status }) {
  const tone = status === 'submitted'
    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
    : 'bg-blue-50 text-blue-600 border-blue-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize ${tone}`}>
      {status || 'open'}
    </span>
  );
}

export default function InterviewPacksPage() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewPack, setViewPack] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchPacks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getInterviewPacks();
      setPacks(res.data?.packs || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load interview packs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPacks(); }, [fetchPacks]);

  async function handleDelete(pack) {
    if (!window.confirm(`Delete "${pack.title}"? This cannot be undone.`)) return;
    setDeletingId(pack.id ?? pack.pack_id);
    try {
      await deleteInterviewPack(pack.id ?? pack.pack_id);
      await fetchPacks();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete pack.');
    } finally {
      setDeletingId(null);
    }
  }

  function handleCopyLink(pack) {
    const link = `${window.location.origin}/interview/${pack.token}`;
    navigator.clipboard.writeText(link).then(() => {
      const id = pack.id ?? pack.pack_id;
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <PageHeader
          title="Interview"
          highlight="Packs"
          subtitle={`${packs.length} pack${packs.length === 1 ? '' : 's'} created`}
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchPacks} className="text-xs">
            <RotateCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Pack
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Loading interview packs…
            </div>
          ) : packs.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-sm text-muted-foreground">No interview packs yet.</p>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Create your first pack
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Job / Title</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Interviewer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Batch</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Window</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Candidates</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Created</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packs.map((pack) => {
                    const id = pack.id ?? pack.pack_id;
                    const isDeleting = deletingId === id;
                    const isCopied = copiedId === id;
                    return (
                      <tr key={id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{pack.title || 'Interview Pack'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{pack.job_title || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{pack.interviewer_name || '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{pack.batch_code || '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {pack.window_start || pack.window_end
                            ? `${fmtDate(pack.window_start)} – ${fmtDate(pack.window_end)}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={pack.status} />
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-medium">
                          {pack.candidate_count ?? pack.candidates?.length ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {fmtDate(pack.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title={isCopied ? 'Copied!' : 'Copy portal link'}
                              onClick={() => handleCopyLink(pack)}
                            >
                              {isCopied
                                ? <Check className="h-3.5 w-3.5 text-emerald-600" />
                                : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="View detail"
                              onClick={() => setViewPack(pack)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                              title="Delete"
                              onClick={() => handleDelete(pack)}
                              disabled={isDeleting}
                            >
                              {isDeleting
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateInterviewPackDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchPacks}
      />

      <PackDetailDialog
        open={!!viewPack}
        onOpenChange={(o) => !o && setViewPack(null)}
        packId={viewPack?.id ?? viewPack?.pack_id}
      />
    </div>
  );
}
