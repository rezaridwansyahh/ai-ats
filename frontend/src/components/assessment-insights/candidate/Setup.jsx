import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fmtDateID } from '../utils/scoring';

export default function Setup({ initial, onSubmit }) {
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [position, setPosition] = useState(initial?.position || '');
  const [department, setDepartment] = useState(initial?.department || '');
  const [education, setEducation] = useState(initial?.education || '');
  const [dateBirth, setDateBirth] = useState(initial?.date_birth || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !position.trim() || !department.trim() || !education || !dateBirth) {
      setError('Mohon lengkapi semua data peserta.');
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
        style={{ background: 'linear-gradient(135deg,#1E1B4B 0%,#4338CA 55%,#7C3AED 100%)' }}
      >
        <div
          className="absolute right-[-10px] top-[-20px] text-[150px] font-bold opacity-[0.06] pointer-events-none leading-none"
        >
          ⬟
        </div>
        <div className="bg-white/15 border border-white/25 inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-3">
          Insights-Discovery Assessment · Pre-Day 1
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">Selamat Datang!</h1>
        <p className="text-base opacity-90 italic mb-4">Tes Profil Kepribadian Kerja</p>
        <p className="text-sm leading-relaxed max-w-2xl opacity-90 mb-4">
          Asesmen ini mengidentifikasi <strong>profil kepribadian kerja</strong> Anda melalui orientasi energi,
          cara pengambilan keputusan, dan pendekatan terhadap informasi. Tidak ada profil yang lebih baik —
          setiap profil memiliki kekuatan uniknya.
        </p>
        <div className="flex gap-2 flex-wrap">
          <span className="bg-white/12 border border-white/20 px-3.5 py-1.5 rounded-full text-[11px] font-semibold">72 pasang pernyataan</span>
          <span className="bg-white/12 border border-white/20 px-3.5 py-1.5 rounded-full text-[11px] font-semibold">~25 menit</span>
          <span className="bg-white/12 border border-white/20 px-3.5 py-1.5 rounded-full text-[11px] font-semibold">8 profil kerja</span>
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
              <Label className="mb-1.5 block">Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Posisi / Jabatan *</Label>
              <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Contoh: Staf Operasional" />
            </div>
            <div>
              <Label className="mb-1.5 block">Departemen / Tim *</Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Contoh: Operations" />
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

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full mt-4 bg-gradient-to-br from-indigo-700 to-violet-600 hover:opacity-90 h-11 disabled:opacity-60"
          >
            {submitting ? 'Menyimpan…' : 'Lanjut →'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
