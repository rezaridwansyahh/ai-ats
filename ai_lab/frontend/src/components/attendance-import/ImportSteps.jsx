import { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fmtDate } from '@/components/dashboard/dashboardMetrics.js';

const selectCls =
  'h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';
const th = 'px-3 py-2 text-left font-medium';

const TONES = {
  crit: 'border-red-200 bg-red-50 text-red-700',
  warn: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
};

const Chip = ({ tone = 'info', children }) => (
  <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONES[tone]}`}>{children}</span>
);

export function StepNav({ onBack, onNext, nextLabel, disabled }) {
  return (
    <div className="mt-3 flex">
      <Button variant="outline" onClick={onBack} disabled={disabled}>← Kembali</Button>
      <span className="flex-1" />
      <Button onClick={onNext} disabled={disabled}>{nextLabel}</Button>
    </div>
  );
}

const STEPS = ['Unggah', 'Pemetaan kolom', 'Pasangkan & periksa', 'Konfirmasi'];

export function Stepper({ step }) {
  return (
    <div className="mb-3.5 flex flex-wrap gap-1.5">
      {STEPS.map((label, i) => {
        const n = i + 1;
        return (
          <div
            key={label}
            className={`min-w-[140px] flex-1 rounded-[9px] border px-[11px] py-2 text-[12.5px] text-muted-foreground ${
              step === n ? 'border-[#0D9276] bg-[#eaf5f1]' : 'border-border bg-card'
            } ${step > n ? 'opacity-70' : ''}`}
          >
            <span>Langkah {n}</span>
            <b className="block text-[13px] text-foreground">{step > n ? '✓ ' : ''}{label}</b>
          </div>
        );
      })}
    </div>
  );
}

export function StepUpload({ busy, onPick }) {
  const inputRef = useRef(null);
  return (
    <div className="rounded-xl border-2 border-dashed border-[#b9d6cc] bg-[#fbfdfc] p-[30px] text-center">
      <div className="text-[30px]">⇪</div>
      <p className="mt-1"><b>Unggah ekspor mesin absensi</b> (.xlsx / .csv, maksimal 5 MB). Satu baris = satu scan.</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Kolom yang dibutuhkan: PIN mesin dan tanggal & jam scan. Tanggal dibaca hari-bulan-tahun (31/10/2026).
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // lets the same file be chosen again
          if (file) onPick(file);
        }}
      />
      <div className="mt-3">
        <Button disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? 'Membaca file…' : 'Pilih file'}
        </Button>
      </div>
    </div>
  );
}

const SOURCE = { saved: 'Tersimpan', template: 'Cocok nama kolom' };

export function StepMapping({ preview, mapping, busy, onChange, onBack, onNext }) {
  const has = (field) => mapping.some((m) => m.field === field);
  const ready = has('pin') && has('waktu');
  const sampleOf = (header) =>
    preview.sample_rows.map((r) => r.cells[header]).filter(Boolean).slice(0, 3).join(', ');

  return (
    <>
      <div className="mb-3.5 rounded-[10px] border border-[#cde5dd] bg-[#eaf5f1] px-3.5 py-2.5 text-[13px]">
        {preview.saved_mapping
          ? 'Pemetaan dari impor sebelumnya dipakai ulang karena kolom file sama. Periksa bila perlu.'
          : 'Pemetaan dicocokkan dari nama kolom. Periksa dan ubah bila perlu; pemetaan disimpan per format file agar impor berikutnya tanpa langkah ini.'}
        {' '}File: <span className="font-mono">{preview.file_name}</span> · {preview.total_rows} baris.
      </div>
      <Card className="gap-0 py-0 shadow-none">
        <CardContent className="overflow-auto p-0">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className={th}>Kolom di file</th>
                <th className={th}>Contoh</th>
                <th className={th}>Dipetakan ke</th>
                <th className={th}>Keyakinan</th>
              </tr>
            </thead>
            <tbody>
              {mapping.map((m) => (
                <tr key={m.header} className="border-b border-border/60">
                  <td className="px-3 py-2 font-semibold">{m.header}</td>
                  <td className="px-3 py-2 font-mono text-xs tracking-wide text-muted-foreground">{sampleOf(m.header)}</td>
                  <td className="px-3 py-2">
                    <select
                      className={`${selectCls} w-full`}
                      value={m.field ?? ''}
                      onChange={(e) => onChange(m.header, e.target.value || null)}
                    >
                      <option value="">— Abaikan —</option>
                      {preview.fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{SOURCE[m.source] ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      {!ready && (
        <p className="mt-2 text-xs text-destructive">Pilih kolom untuk "PIN mesin" dan "Tanggal & jam scan" sebelum lanjut.</p>
      )}
      <StepNav onBack={onBack} onNext={onNext} nextLabel={busy ? 'Memeriksa…' : 'Pasangkan scan →'} disabled={busy || !ready} />
    </>
  );
}

const examples = (list) => list.map((e) => `${e.nama} (${fmtDate(e.tgl)})`).join(', ');
const info = (text) => <span className="text-xs text-muted-foreground">{text}</span>;

function issueRow(issue, decisions, busy, onDecide) {
  switch (issue.kind) {
    case 'unknown_pin':
      return {
        key: `pin-${issue.pin}`,
        chip: <Chip tone="crit">PIN tidak dikenal</Chip>,
        detail: `PIN ${issue.pin} (${issue.scans} scan) belum dipetakan ke NIK. Nama di mesin: "${issue.nama || '—'}"`,
        action: (
          <select
            className={selectCls}
            disabled={busy}
            value={decisions.pins[issue.pin] ?? 'skip'}
            onChange={(e) => onDecide('pins', issue.pin, e.target.value)}
          >
            <option value="skip">Abaikan (lewati scan PIN ini)</option>
            {issue.candidates.map((c) => (
              <option key={c.nik} value={c.nik}>Petakan ke {c.nama} ({c.nik})</option>
            ))}
          </select>
        ),
      };
    case 'conflict':
      return {
        key: `conflict-${issue.key}`,
        chip: <Chip tone="info">Bentrok dengan data lain</Chip>,
        detail: `${issue.nama}, ${fmtDate(issue.tgl)}: sudah ada status ${issue.existing_status} (sumber: ${issue.existing_source})`,
        action: (
          <select
            className={selectCls}
            disabled={busy}
            value={decisions.conflicts[issue.key] ?? 'keep'}
            onChange={(e) => onDecide('conflicts', issue.key, e.target.value)}
          >
            <option value="keep">Pertahankan data yang ada</option>
            <option value="overwrite">Timpa dengan data mesin</option>
          </select>
        ),
      };
    case 'single_scan':
      return {
        key: 'single',
        chip: <Chip tone="warn">Scan tunggal</Chip>,
        detail: `${issue.count} hari-orang hanya punya 1 scan → ditandai lupa absen. Contoh: ${examples(issue.examples)}`,
        action: info('Disimpan dengan tanda'),
      };
    case 'double_scan':
      return {
        key: 'double',
        chip: <Chip tone="info">Scan ganda</Chip>,
        detail: `${issue.count} scan berulang < 2 menit (jari ditempel dua kali)`,
        action: info('Digabung otomatis'),
      };
    default:
      return {
        key: 'invalid',
        chip: <Chip tone="warn">Baris tidak terbaca</Chip>,
        detail: `${issue.count} baris dilewati. Contoh: ${issue.examples.map((e) => `baris ${e.row} (${e.message})`).join(', ')}`,
        action: info('Dilewati'),
      };
  }
}

export function StepCheck({ result, decisions, busy, onDecide, onBack, onNext }) {
  const rows = result.issues.map((issue) => issueRow(issue, decisions, busy, onDecide));

  return (
    <>
      <div className="mb-3.5 rounded-[10px] border border-[#f1d3a3] bg-[#fff4e2] px-3.5 py-2.5 text-[13px]">
        Sistem (bukan AI) memasangkan scan pertama = masuk, scan terakhir = pulang per orang per hari.
        {' '}{result.scans} scan → {result.days} hari-orang.
        {rows.length ? ' Hal yang perlu keputusan:' : ' Tidak ada masalah ditemukan.'}
      </div>
      {rows.length > 0 && (
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="overflow-auto p-0">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className={th}>Masalah</th>
                  <th className={th}>Detail</th>
                  <th className={th}>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-b border-border/60">
                    <td className="px-3 py-2">{r.chip}</td>
                    <td className="px-3 py-2">{r.detail}</td>
                    <td className="px-3 py-2">{r.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
      <StepNav onBack={onBack} onNext={onNext} nextLabel="Lanjut →" disabled={busy || result.days === 0} />
    </>
  );
}