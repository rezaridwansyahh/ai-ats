import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MODES } from '../data/tki';
import { fmtDateID } from '../utils/scoring';

export default function Setup({ initial, onSubmit, emailReadOnly = false }) {
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [position, setPosition] = useState(initial?.position || '');
  const [department, setDepartment] = useState(initial?.department || '');
  const [education, setEducation] = useState(initial?.education || '');
  const [dateBirth, setDateBirth] = useState(initial?.date_birth || '');
  const [gender, setGender] = useState(initial?.gender || '');
  const [umur, setUmur] = useState(initial?.umur || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !position.trim() || !department.trim() || !education || !dateBirth) {
      setError('Mohon lengkapi semua data peserta yang wajib (*).');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        position: position.trim(),
        department: department.trim(),
        education,
        date_birth: dateBirth,
        gender,
        umur: umur.trim(),
        date: fmtDateID(),
      });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Gagal menyimpan data peserta. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6">
      <div
        className="rounded-2xl p-8 mb-5 text-white relative overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(135deg,#022C22 0%,#064E3B 50%,#0A6E5C 100%)' }}
      >
        <div className="absolute right-[-10px] bottom-[-20px] text-[150px] font-bold opacity-[0.07] pointer-events-none leading-none">⚖</div>
        <div className="bg-white/15 border border-white/25 inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-3">
          Thomas-Kilmann Assessment · Pre-Day 1
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">Selamat Datang!</h1>
        <p className="text-base opacity-90 italic mb-4">Asesmen Mode Penanganan Konflik</p>
        <p className="text-sm leading-relaxed max-w-2xl opacity-90 mb-4">
          Instrumen pengembangan diri untuk memahami <strong>gaya penanganan konflik</strong> Anda. Tidak ada mode yang
          lebih baik — setiap mode memiliki kegunaan situasionalnya masing-masing.
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {Object.values(MODES).map((m) => (
            <span key={m.eng} className="px-2.5 py-1 rounded text-[10px] font-bold text-white" style={{ background: m.color + 'cc' }}>
              {m.name}
            </span>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="text-xs font-bold tracking-wider uppercase text-slate-500">Data Peserta</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Nama Lengkap *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" />
            </div>
            <div>
              <Label className="mb-1.5 block">
                Email *{emailReadOnly && <span className="ml-1.5 text-[10px] font-normal text-slate-400">(terverifikasi · tidak dapat diubah)</span>}
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                readOnly={emailReadOnly}
                className={emailReadOnly ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : undefined}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Jabatan / Posisi *</Label>
              <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Posisi Anda" />
            </div>
            <div>
              <Label className="mb-1.5 block">Departemen / Tim *</Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Divisi atau tim Anda" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Pendidikan Terakhir *</Label>
              <Select value={education} onValueChange={setEducation}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenjang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMA/SMK">SMA/SMK</SelectItem>
                  <SelectItem value="D3">D3</SelectItem>
                  <SelectItem value="S1">S1</SelectItem>
                  <SelectItem value="S2">S2</SelectItem>
                  <SelectItem value="S3">S3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Tanggal Lahir *</Label>
              <Input type="date" value={dateBirth} onChange={(e) => setDateBirth(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Jenis Kelamin</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Usia</Label>
              <Input value={umur} onChange={(e) => setUmur(e.target.value)} placeholder="Contoh: 28 tahun" />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full mt-4 bg-gradient-to-br from-teal-800 to-teal-600 hover:opacity-90 h-11 disabled:opacity-60"
          >
            {submitting ? 'Menyimpan…' : 'Lanjut →'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
