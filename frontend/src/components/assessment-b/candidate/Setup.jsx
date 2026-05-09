import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fmtDateID } from '../utils/scoring';

export default function Setup({ initial, onSubmit }) {
  const [name, setName] = useState(initial?.name || '');
  const [jabatan, setJabatan] = useState(initial?.jabatan || '');
  const [gender, setGender] = useState(initial?.gender || '');
  const [education, setEducation] = useState(initial?.education || '');
  const [tglLahir, setTglLahir] = useState(initial?.tglLahirRaw || '');

  const fmtTgl = (raw) =>
    raw ? new Date(raw).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  const handleSubmit = () => {
    if (!name.trim() || !jabatan.trim()) {
      alert('Nama dan posisi wajib diisi.');
      return;
    }
    onSubmit({
      name: name.trim(),
      jabatan: jabatan.trim(),
      gender,
      education,
      tglLahir: fmtTgl(tglLahir),
      tglLahirRaw: tglLahir,
      tglTesRaw: new Date().toISOString().split('T')[0],
      date: fmtDateID(),
    });
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6">
      <div
        className="rounded-xl p-8 mb-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0A2A22 0%,#064E3B 45%,#0A6E5C 100%)' }}
      >
        <h1 className="font-serif text-2xl md:text-3xl mb-2">Asesmen Battery B</h1>
        <p className="text-sm opacity-90 max-w-md leading-relaxed">
          Profesional & Individual Contributor · TK Kognitif · Kepribadian · Minat Kerja · Preferensi Kerja
        </p>
        <div className="text-xs mt-2 opacity-60">v10 · 4 tes terpadu · ~140 menit total</div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="text-xs font-bold tracking-wider uppercase text-slate-500">📋 Data Kandidat</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Nama Kandidat *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" />
            </div>
            <div>
              <Label className="mb-1.5 block">Posisi yang Dilamar *</Label>
              <Input
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Contoh: Supervisor HRD"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <Label className="mb-1.5 block">Pendidikan</Label>
              <Select value={education} onValueChange={setEducation}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMA/SMK">SMA/SMK</SelectItem>
                  <SelectItem value="D3">D3</SelectItem>
                  <SelectItem value="S1">S1</SelectItem>
                  <SelectItem value="S2">S2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Tanggal Lahir</Label>
              <Input type="date" value={tglLahir} onChange={(e) => setTglLahir(e.target.value)} />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full mt-4 bg-gradient-to-br from-teal-800 to-teal-600 hover:opacity-90 h-11"
          >
            Mulai Asesmen →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
