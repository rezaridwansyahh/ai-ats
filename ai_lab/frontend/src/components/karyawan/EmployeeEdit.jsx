import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateEmployee } from '@/api/employees.api';

const LEVELS = ['Direktur', 'Manajer', 'Supervisor', 'Staf', 'Operator'];
const SELECT = 'h-9 w-full rounded-lg border border-input bg-card px-2.5 text-sm';

function EditForm({ e, all, onClose, onSaved }) {
  const [v, setV] = useState({
    jabatan: e.jabatan ?? '', level: e.level ?? '', divisi: e.divisi ?? '', lokasi: e.lokasi ?? '', atasan: e.atasan ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const uniq = (k) => [...new Set([...all.map((x) => x[k]), e[k]].filter(Boolean))].sort();
  const current = all.find((x) => x.nik === e.atasan);
  const bosses = all.filter((x) => x.aktif === 'Aktif' && x.nik !== e.nik && ['Direktur', 'Manajer', 'Supervisor'].includes(x.level));
  if (current && !bosses.includes(current)) bosses.push(current);
  const set = (k) => (ev) => setV((s) => ({ ...s, [k]: ev.target.value }));

  const save = async () => {
    const changes = {};
    Object.keys(v).forEach((k) => {
      const next = v[k].trim();
      if (next !== (e[k] ?? '')) changes[k] = next;
    });
    if (!Object.keys(changes).length) { setError('Tidak ada perubahan'); return; }
    if ('jabatan' in changes && !changes.jabatan) { setError('Jabatan tidak boleh kosong'); return; }
    setSaving(true);
    setError('');
    try {
      await updateEmployee(e.id, changes);
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Gagal menyimpan perubahan');
      setSaving(false);
    }
  };

  const select = (k, options, empty) => (
    <select id={`ed-${k}`} className={SELECT} value={v[k]} onChange={set(k)}>
      {empty && <option value="">—</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
  const plain = (list) => list.map((o) => ({ value: o, label: o }));

  return (
    <>
      <DialogHeader>
        <DialogTitle>Ubah data pekerjaan — {e.nama}</DialogTitle>
        <DialogDescription>Perubahan langsung diterapkan ke data karyawan.</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-[130px_minmax(0,1fr)] items-center gap-x-3 gap-y-2.5 text-sm">
        <label htmlFor="ed-jabatan">Jabatan</label>
        <Input id="ed-jabatan" className="h-9" value={v.jabatan} onChange={set('jabatan')} />
        <label htmlFor="ed-level">Level</label>
        {select('level', plain(LEVELS))}
        <label htmlFor="ed-divisi">Divisi</label>
        {select('divisi', plain(uniq('divisi')))}
        <label htmlFor="ed-lokasi">Lokasi</label>
        {select('lokasi', plain(uniq('lokasi')))}
        <label htmlFor="ed-atasan">Atasan langsung</label>
        {select('atasan', bosses.map((b) => ({ value: b.nik, label: `${b.nama} · ${b.jabatan}` })), true)}
      </div>

      <p className="text-xs text-muted-foreground">
        Tanggal berlaku, alasan perubahan, perubahan terjadwal, dan riwayat perubahan belum ada di backend, jadi belum ada di form ini.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</Button>
      </DialogFooter>
    </>
  );
}

export default function EditEmployeeDialog({ open, onOpenChange, employee, all, onSaved }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Rendered only while open, so the form starts fresh from the current data every time */}
        <EditForm e={employee} all={all} onClose={() => onOpenChange(false)} onSaved={onSaved} />
      </DialogContent>
    </Dialog>
  );
}