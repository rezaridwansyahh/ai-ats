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

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !position.trim() || !department.trim() || !education || !dateBirth) {
      alert('Mohon lengkapi semua data peserta.');
      return;
    }
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      position: position.trim(),
      department: department.trim(),
      education,
      date_birth: dateBirth,
      tglTesRaw: new Date().toISOString().split('T')[0],
      date: fmtDateID(),
    });
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6">
      <div
        className="rounded-2xl p-8 mb-5 text-white relative overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(135deg,#0A2A22 0%,#064E3B 45%,#0A6E5C 100%)' }}
      >
        <div
          className="absolute right-[-20px] top-[-40px] text-[180px] font-bold opacity-[0.06] pointer-events-none"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          B
        </div>
        <div className="bg-white/15 border border-white/25 inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-3">
          Assessment · Battery B
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">Selamat Datang!</h1>
        <p className="text-base opacity-90 italic mb-4">Profesional & Individual Contributor</p>
        <p className="text-sm leading-relaxed max-w-2xl opacity-90 mb-4">
          Asesmen ini mengukur <strong>kemampuan kognitif, kepribadian, minat kerja, dan preferensi kerja</strong>.
        </p>
        <div className="flex gap-2 flex-wrap">
          <span className="bg-white/12 border border-white/20 px-3.5 py-1.5 rounded-full text-[11px] font-semibold">4 sub-tes</span>
          <span className="bg-white/12 border border-white/20 px-3.5 py-1.5 rounded-full text-[11px] font-semibold">~140 menit</span>
          <span className="bg-white/12 border border-white/20 px-3.5 py-1.5 rounded-full text-[11px] font-semibold">v10</span>
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
              <Label className="mb-1.5 block">Posisi *</Label>
              <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Contoh: Supervisor HRD" />
            </div>
            <div>
              <Label className="mb-1.5 block">Departemen *</Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Contoh: Human Resources" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Pendidikan *</Label>
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
