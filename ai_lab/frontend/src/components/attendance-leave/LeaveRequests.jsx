import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fmtDate } from '@/components/dashboard/dashboardMetrics.js';

const TONES = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warn: 'border-amber-200 bg-amber-50 text-amber-800',
  crit: 'border-red-200 bg-red-50 text-red-700',
};
const inputCls = 'h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';
const JENIS = ['Cuti tahunan', 'Izin', 'Sakit', 'Dinas Luar', 'WFH'];

const Chip = ({ tone, children }) => (
  <span className={`m-px inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONES[tone]}`}>{children}</span>
);

const range = (a, b) => (a === b ? fmtDate(a) : `${fmtDate(a)} – ${fmtDate(b)}`);
export const fmtDateTime = (s) => new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

export function RequestForm({ employees, busy, onSubmit, onCancel }) {
  const [f, setF] = useState({ nik: '', jenis: 'Cuti tahunan', tgl_mulai: '', tgl_selesai: '', alasan: '' });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const ready = f.nik && f.tgl_mulai && f.tgl_selesai;

  return (
    <Card className="gap-0 border-primary/30 py-0 shadow-none">
      <CardContent className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Buat pengajuan</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs text-muted-foreground">Karyawan
            <select className={inputCls} value={f.nik} onChange={set('nik')}>
              <option value="">Pilih karyawan…</option>
              {employees.map((e) => <option key={e.nik} value={e.nik}>{e.nama} ({e.divisi})</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">Jenis
            <select className={inputCls} value={f.jenis} onChange={set('jenis')}>
              {JENIS.map((j) => <option key={j}>{j}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">Tanggal mulai
            <input
              type="date"
              className={inputCls}
              value={f.tgl_mulai}
              onChange={(e) => setF((p) => ({ ...p, tgl_mulai: e.target.value, tgl_selesai: p.tgl_selesai || e.target.value }))}
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">Tanggal selesai
            <input type="date" className={inputCls} value={f.tgl_selesai} min={f.tgl_mulai} onChange={set('tgl_selesai')} />
          </label>
        </div>
        <label className="block space-y-1 text-xs text-muted-foreground">Alasan (opsional)
          <input className={inputCls} maxLength={255} value={f.alasan} onChange={set('alasan')} />
        </label>
        <div className="flex gap-2">
          <Button disabled={!ready || busy} onClick={() => onSubmit(f)}>{busy ? 'Menyimpan…' : 'Buat pengajuan'}</Button>
          <Button variant="outline" onClick={onCancel}>Batal</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function LinkCard({ info, busy, onCopy, onResend, onClose }) {
  return (
    <Card className="gap-0 border-primary/30 py-0 shadow-none">
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Link persetujuan atasan · {info.nama}</h3>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>Tutup</Button>
        </div>
        {info.expired ? (
          <p className="text-sm text-muted-foreground">Link sudah kedaluwarsa. Buat link baru untuk dikirim ke atasan.</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded border bg-background px-2 py-1.5 font-mono text-[11px]">{info.url}</code>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onCopy}>Salin</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Dibuka tanpa login, sekali pakai · berlaku sampai {fmtDateTime(info.expires)}
            </p>
          </>
        )}
        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={busy} onClick={onResend}>
          {busy ? 'Membuat…' : 'Buat link baru'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function RequestTable({ requests, onLink }) {
  const th = 'px-3 py-2 text-left font-medium';
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="overflow-auto p-0">
        <h3 className="px-4 pb-1 pt-3 text-sm font-semibold">Pengajuan</h3>
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className={th}>Karyawan</th>
              <th className={th}>Jenis</th>
              <th className={th}>Tanggal</th>
              <th className={`${th} text-right`}>Hari kerja</th>
              <th className={th}>Cek otomatis</th>
              <th className={th}>Status</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-border/60">
                <td className="px-3 py-2">
                  <Link to={`/attendance/rekap/${r.nik}`} className="font-semibold hover:underline">{r.nama}</Link>
                  <div className="text-xs text-muted-foreground">{r.divisi}</div>
                </td>
                <td className="px-3 py-2">{r.jenis}</td>
                <td className="px-3 py-2">{range(r.tgl_mulai, r.tgl_selesai)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.hari_kerja}</td>
                <td className="px-3 py-2">
                  {r.cek.saldo === 'belum_berhak' && <Chip tone="crit">Belum berhak</Chip>}
                  {r.cek.saldo === 'kurang' && <Chip tone="crit">Saldo kurang</Chip>}
                  {r.cek.saldo === 'cukup' && <Chip tone="ok">Saldo cukup ({r.cek.sisa})</Chip>}
                  {r.cek.bersamaan > 0 && <Chip tone="warn">Bersamaan {r.cek.bersamaan} orang di {r.divisi}</Chip>}
                </td>
                <td className="px-3 py-2">
                  <Chip tone={r.status === 'Disetujui' ? 'ok' : r.status === 'Ditolak' ? 'crit' : 'warn'}>{r.status}</Chip>
                </td>
                <td className="px-3 py-2">
                  {r.status === 'Menunggu atasan' && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onLink(r)}>Lihat link atasan</Button>
                  )}
                </td>
              </tr>
            ))}
            {!requests.length && (
              <tr><td colSpan={7} className="px-4 py-4 text-sm text-muted-foreground">Belum ada pengajuan.</td></tr>
            )}
          </tbody>
        </table>
        <p className="px-4 pb-3 pt-2 text-xs text-muted-foreground">Cek otomatis memakai aturan, bukan AI.</p>
      </CardContent>
    </Card>
  );
}