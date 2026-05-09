import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fmtDateID, getIQClass, pctToScore10, IQ_TABLE } from '../utils/scoring';

export default function ReportSetup({ hasCardData, profile, results, state, updateState, onBuild }) {
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [position, setPosition] = useState(profile?.position || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [education, setEducation] = useState(profile?.education || '');
  const [dateBirth, setDateBirth] = useState(profile?.date_birth || '');
  const [tglTes, setTglTes] = useState(profile?.tglTesRaw || new Date().toISOString().split('T')[0]);

  const [nomerKandidat, setNomerKandidat] = useState(state.nomerKandidat || '');
  const [asesor, setAsesor] = useState(state.asesor || '');
  const [mengetahui, setMengetahui] = useState(state.mengetahui || '');

  // Manual fallback (when no Card data)
  const [giOk, setGiOk] = useState(results?.tk?.sub?.GI?.ok || '');
  const [giS10, setGiS10] = useState(results?.tk?.sub?.GI?.score10 || '');
  const [tkComp, setTkComp] = useState(results?.tk?.composite || '');
  const [holCode, setHolCode] = useState(results?.holland?.code3 || '');

  const fmtTgl = (raw) => (raw ? new Date(raw).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '');

  const handleBuild = () => {
    if (!name.trim() || !position.trim()) {
      alert('Nama dan posisi wajib diisi.');
      return;
    }
    updateState({
      nomerKandidat: nomerKandidat.trim(),
      asesor: asesor.trim(),
      mengetahui: mengetahui.trim(),
    });

    const newProfile = {
      name: name.trim(),
      email: email.trim(),
      position: position.trim(),
      department: department.trim(),
      education,
      date_birth: dateBirth,
      date: fmtTgl(tglTes) || fmtDateID(),
      tglTesRaw: tglTes,
    };

    // Manual fallback for TK if missing composite
    let manual = null;
    if (!results?.tk?.composite && tkComp) {
      const comp = parseFloat(tkComp);
      const ok = parseInt(giOk) || 0;
      const iq = IQ_TABLE[Math.min(ok, 50)] || 90;
      manual = {
        tk: {
          composite: comp,
          compVerdict: comp >= 7 ? 'pass' : comp >= 5 ? 'warn' : 'fail',
          sub: {
            GI: { ok, score10: parseInt(giS10) || pctToScore10((ok / 50) * 100), iq, iqCls: getIQClass(iq), items: 50 },
            PV: { score10: pctToScore10(60), items: 25 },
            KN: { score10: pctToScore10(60), items: 40 },
            PA: { score10: pctToScore10(60), items: 40 },
            KA: { score10: pctToScore10(60), items: 40 },
          },
          date: fmtDateID(),
        },
      };
    }
    if (!results?.holland?.code3 && holCode.length >= 2) {
      manual = manual || {};
      manual.holland = {
        code3: holCode.toUpperCase().slice(0, 3),
        top1: holCode[0]?.toUpperCase(),
        top2: holCode[1]?.toUpperCase() || holCode[0]?.toUpperCase(),
        consistency: 'Sedang',
        scores: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
        date: fmtDateID(),
      };
    }

    onBuild(newProfile, manual);
  };

  const completedTests = Object.keys(results || {}).length;

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6">
      <div
        className="rounded-xl p-7 mb-4 text-white relative overflow-hidden shadow-lg"
        style={{ background: 'linear-gradient(135deg,#0A2A22 0%,#064E3B 45%,#0A6E5C 100%)' }}
      >
        <h1 className="font-serif text-xl md:text-2xl mb-1.5">Laporan Psikologis — Battery B</h1>
        <p className="text-sm opacity-85 leading-relaxed max-w-[500px]">
          Profesional & Individual Contributor · TK Kognitif · Kepribadian · Minat Kerja · Preferensi Kerja
        </p>
        <div className="text-xs mt-2 opacity-60">v10 · Rahasia — hanya untuk rekruter</div>
      </div>

      {hasCardData && profile ? (
        <div className="bg-green-50 border-[1.5px] border-green-200 rounded-xl px-4 py-3.5 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-teal-800 mb-0.5">Data Kandidat Ditemukan</div>
            <div className="text-base font-bold text-slate-800">
              {profile.name} · {profile.position}
            </div>
            <div className="text-xs text-emerald-800">
              {completedTests} dari 4 tes selesai · Tes: {profile.date || ''}
              {profile.date_birth ? ' · Lahir: ' + fmtTgl(profile.date_birth) : ''}
            </div>
          </div>
          <Button onClick={handleBuild} className="bg-teal-600 hover:bg-teal-700 h-10">
            Buat Laporan →
          </Button>
        </div>
      ) : (
        <div className="bg-amber-50 border-[1.5px] border-amber-200 rounded-xl px-4 py-3 mb-4 text-xs text-amber-900">
          Tidak ada data tes di browser ini. Buka tab <strong>Tes Kandidat</strong> dulu, atau input skor manual di bawah.
        </div>
      )}

      <Card className="mb-4">
        <CardContent className="pt-6 space-y-4">
          <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Lengkapi Data Laporan</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Nama Kandidat *</Label>
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
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Human Resources" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="mb-1.5 block">Pendidikan</Label>
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
              <Label className="mb-1.5 block">Tanggal Lahir</Label>
              <Input type="date" value={dateBirth} onChange={(e) => setDateBirth(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">No. Kandidat</Label>
              <Input value={nomerKandidat} onChange={(e) => setNomerKandidat(e.target.value)} placeholder="KND-B-001" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="mb-1.5 block">Tanggal Tes</Label>
              <Input type="date" value={tglTes} onChange={(e) => setTglTes(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Nama Asesor</Label>
              <Input value={asesor} onChange={(e) => setAsesor(e.target.value)} placeholder="Nama asesor/rekruter" />
            </div>
            <div>
              <Label className="mb-1.5 block">Mengetahui</Label>
              <Input value={mengetahui} onChange={(e) => setMengetahui(e.target.value)} placeholder="Nama dan jabatan" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="pt-6 space-y-3">
          <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Input Skor Manual (jika data tidak tersimpan)</div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-700">TK — Kemampuan Kognitif</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="mb-1.5 block">GI Benar (0–50)</Label>
              <Input type="number" min={0} max={50} value={giOk} onChange={(e) => setGiOk(e.target.value)} placeholder="0–50" />
            </div>
            <div>
              <Label className="mb-1.5 block">GI Skor /10</Label>
              <Input type="number" min={1} max={10} value={giS10} onChange={(e) => setGiS10(e.target.value)} placeholder="1–10" />
            </div>
            <div>
              <Label className="mb-1.5 block">TK Komposit /10</Label>
              <Input type="number" step="0.1" min={1} max={10} value={tkComp} onChange={(e) => setTkComp(e.target.value)} placeholder="1–10" />
            </div>
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 mt-3">Holland (Kode RIASEC)</div>
          <div>
            <Label className="mb-1.5 block">Kode 3 Huruf</Label>
            <Input
              value={holCode}
              onChange={(e) => setHolCode(e.target.value.toUpperCase())}
              maxLength={3}
              className="max-w-[150px] uppercase"
              placeholder="mis: RIC"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleBuild} className="w-full h-11 bg-gradient-to-br from-teal-800 to-teal-600 hover:opacity-90">
        Buat Laporan Psikologis →
      </Button>
    </div>
  );
}
