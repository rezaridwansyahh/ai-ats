import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  getLeaveRequests, createLeaveRequest, getLeaveLink, resendLeaveLink, getLeaveSaldo, setLeaveBalance,
} from '@/api/leave.api';
import PageHead from '@/components/attendance/PageHead';
import PageState from '@/components/attendance/PageState';
import { RequestForm, LinkCard, RequestTable } from '@/components/attendance-leave/LeaveRequests';
import { SaldoTable, BalanceEditor } from '@/components/attendance-leave/LeaveSaldo';

const STATUSES = [['', 'Semua'], ['Menunggu atasan', 'Menunggu atasan'], ['Disetujui', 'Disetujui'], ['Ditolak', 'Ditolak']];
const errMsg = (err) => err?.response?.data?.message || err?.message || 'Terjadi kesalahan';
const body = (res) => res.data?.data ?? res.data;

export default function AttendanceLeave() {
  const [status, setStatus] = useState('');
  const [requests, setRequests] = useState(null);
  const [saldo, setSaldo] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [linkInfo, setLinkInfo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setError(null);
    getLeaveRequests({ status: status || undefined })
      .then((res) => { if (alive) setRequests(body(res).requests); })
      .catch((err) => { if (alive) setError(errMsg(err)); });
    return () => { alive = false; };
  }, [status, reloadKey]);

  useEffect(() => {
    let alive = true;
    getLeaveSaldo()
      .then((res) => { if (alive) setSaldo(body(res)); })
      .catch((err) => { if (alive) setError(errMsg(err)); });
    return () => { alive = false; };
  }, [reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const run = async (fn) => {
    setBusy(true);
    try {
      return await fn();
    } catch (err) {
      toast.error(errMsg(err));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const create = async (f) => {
    const res = await run(() => createLeaveRequest({ ...f, alasan: f.alasan.trim() || undefined }));
    if (!res) return;
    const { request, portal_url } = body(res);
    setLinkInfo({ id: request.id, nama: saldo?.saldo.find((s) => s.nik === request.nik)?.nama ?? request.nik, url: portal_url, expires: request.token_expires_at });
    setShowForm(false);
    toast('Pengajuan dibuat. Kirim link ke atasan.');
    reload();
  };

  const showLink = async (r) => {
    setBusy(true);
    try {
      const res = await getLeaveLink(r.id);
      const { portal_url, token_expires_at } = body(res);
      setLinkInfo({ id: r.id, nama: r.nama, url: portal_url, expires: token_expires_at });
    } catch (err) {
      if (err?.response?.status === 410) setLinkInfo({ id: r.id, nama: r.nama, expired: true });
      else { toast.error(errMsg(err)); reload(); }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    const res = await run(() => resendLeaveLink(linkInfo.id));
    if (!res) return;
    const { portal_url, token_expires_at } = body(res);
    setLinkInfo((p) => ({ ...p, url: portal_url, expires: token_expires_at, expired: false }));
    toast('Link baru dibuat');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(linkInfo.url);
      toast('Link disalin');
    } catch {
      toast.error('Gagal menyalin link');
    }
  };

  const saveBalance = async (values) => {
    const res = await run(() => setLeaveBalance(editing.nik, { tahun: saldo.tahun, ...values }));
    if (!res) return;
    setEditing(null);
    toast('Saldo diperbarui');
    reload();
  };

  return (
    <div className="space-y-4">
      <PageHead
        code="M3-06"
        title="Cuti & saldo"
        sub="Pengajuan dari aplikasi persetujuan via link (milik tim) masuk ke sini; saldo dihitung otomatis"
      />

      <div className="rounded-[10px] border border-[#cde5dd] bg-[#eaf5f1] px-3.5 py-2.5 text-[13px]">
        Alur: karyawan mengajukan → atasan menerima <b>link</b> (email/WhatsApp) → setuju/tolak tanpa login → status &amp; saldo
        diperbarui → tercatat di data kehadiran.
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Status:</span>
        {STATUSES.map(([value, label]) => (
          <Button key={label} size="sm" variant={status === value ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setStatus(value)}>
            {label}
          </Button>
        ))}
        <span className="flex-1" />
        <Button size="sm" className="h-7 text-xs" disabled={!saldo} onClick={() => setShowForm((v) => !v)}>
          + Buat pengajuan
        </Button>
      </div>

      {showForm && saldo && (
        <RequestForm employees={saldo.saldo} busy={busy} onSubmit={create} onCancel={() => setShowForm(false)} />
      )}
      {linkInfo && (
        <LinkCard info={linkInfo} busy={busy} onCopy={copy} onResend={resend} onClose={() => setLinkInfo(null)} />
      )}

      {error || !requests ? (
        <PageState error={error} retry={reload} />
      ) : (
        <RequestTable requests={requests} onLink={showLink} />
      )}

      {editing && (
        <BalanceEditor key={editing.nik} row={editing} busy={busy} onSave={saveBalance} onCancel={() => setEditing(null)} />
      )}
      {saldo && <SaldoTable saldo={saldo.saldo} tanggal={saldo.tanggal} onEdit={setEditing} />}
    </div>
  );
}