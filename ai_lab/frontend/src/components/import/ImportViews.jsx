import { Card, CardContent } from '@/components/ui/card';
import { Tag } from '@/components/karyawan/EmployeeTags';
import { groupIssues, nameList, samplesOf } from './importUtils.js';

const TH = 'sticky top-0 border-b border-border bg-muted/60 px-3 py-2 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground';
const TD = 'border-b border-border/60 px-3 py-2 align-top';
const SELECT = 'h-8 w-full rounded-lg border border-input bg-card px-2 text-sm';

export function Banner({ tone, children }) {
  const cls = tone === 'warn' ? 'border-[#f1d3a3] bg-warning/15'
    : tone === 'ai' ? 'border-violet-200 bg-violet-50'
    : tone === 'ok' ? 'border-emerald-200 bg-emerald-50'
    : 'border-border bg-muted/50';
  return <div className={`rounded-[10px] border px-3 py-2.5 text-[13px] ${cls}`}>{children}</div>;
}

export function Stepper({ step }) {
  const steps = ['Unggah', 'Pemetaan kolom', 'Laporan masalah', 'Konfirmasi'];
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
      {steps.map((s, i) => {
        const n = i + 1;
        const cls = step === n ? 'border-primary bg-accent text-primary' : step > n ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-border bg-card text-muted-foreground';
        return (
          <div key={s} className={`rounded-lg border px-3 py-2 ${cls}`}>
            <span className="block text-[11px]">Langkah {n}</span>
            <b className="text-[13px]">{step > n ? '✓ ' : ''}{s}</b>
          </div>
        );
      })}
    </div>
  );
}

export function MappingStep({ preview, map, manual, dupes, onChange }) {
  const rows = preview.mapping;
  const allTemplate = rows.every((m) => m.source === 'template');
  return (
    <div className="space-y-3">
      {preview.ai_error ? (
        <Banner tone="warn">⚠ <b>Saran AI gagal:</b> {preview.ai_error}. Petakan kolom yang masih kosong secara manual.</Banner>
      ) : preview.ai_used ? (
        <Banner tone="ai">
          ✦ <b>Saran AI</b> — untuk kolom yang tidak dikenali, AI melihat judul kolom dan maksimal 3 contoh nilai (email disamarkan).
          Periksa terutama yang <Tag tone="warn">keyakinan rendah</Tag>.
        </Banner>
      ) : allTemplate ? (
        <Banner tone="ok">✓ <b>Template Myralix dikenali.</b> Semua kolom dipetakan otomatis oleh aturan pola, tanpa AI.</Banner>
      ) : (
        <Banner>Sebagian kolom tidak dikenali. Petakan secara manual, atau biarkan "— Abaikan —".</Banner>
      )}

      <Card className="gap-0 overflow-auto py-0 shadow-none">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className={TH}>Kolom di file</th>
              <th className={`${TH} hidden md:table-cell`}>Contoh nilai</th>
              <th className={TH}>Dipetakan ke</th>
              <th className={TH}>Keyakinan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const field = map[m.header] ?? '';
              const isManual = manual[m.header];
              const low = !isManual && m.source === 'ai' && m.confidence < 0.8;
              const dup = field && dupes.has(field);
              return (
                <tr key={m.header} className={dup ? 'bg-destructive/10' : low ? 'bg-warning/15' : ''}>
                  <td className={TD}><b>{m.header}</b></td>
                  <td className={`${TD} hidden text-xs text-muted-foreground md:table-cell`}>
                    {samplesOf(preview.sample_rows, m.header).join(', ') || '—'}
                  </td>
                  <td className={TD}>
                    <select className={SELECT} value={field} onChange={(e) => onChange(m.header, e.target.value)}>
                      <option value="">— Abaikan —</option>
                      {preview.fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                    {dup && <p className="mt-0.5 text-xs text-destructive">Dipakai lebih dari satu kolom</p>}
                  </td>
                  <td className={TD}>
                    {isManual ? <Tag>manual</Tag>
                      : m.source === 'template' ? <Tag>aturan pola · tanpa AI</Tag>
                      : m.source === 'ai' ? (
                        <span className="flex items-center gap-1.5">
                          <span className="font-mono text-[12.5px]">{Math.round(m.confidence * 100)}%</span>
                          {low && <Tag tone="warn">cek</Tag>}
                        </span>
                      ) : <Tag>belum dipetakan</Tag>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function IssuesStep({ report, decisions, busy, onDecide }) {
  const groups = groupIssues(report.issues);
  return (
    <div className="space-y-3">
      <Banner tone={groups.length ? 'warn' : 'ok'}>
        {groups.length
          ? <>Pemeriksaan dijalankan oleh <b>sistem</b> (aturan di server), bukan AI. {report.issues.length} masalah di {groups.length} baris. Pilih tindakan untuk tiap baris.</>
          : <>✓ Tidak ada masalah. Pemeriksaan dijalankan oleh <b>sistem</b>, bukan AI.</>}
        {busy && <span className="ml-2 text-xs text-muted-foreground">Memperbarui hasil…</span>}
      </Banner>

      {groups.length > 0 && (
        <Card className="gap-0 overflow-auto py-0 shadow-none">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr><th className={TH}>Baris</th><th className={TH}>Karyawan</th><th className={TH}>Masalah</th><th className={TH}>Tindakan</th></tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const current = decisions[g.row] ?? 'default';
                const canMerge = g.same?.choices?.includes('merge');
                return (
                  <tr key={g.row}>
                    <td className={`${TD} font-mono text-xs`}>{g.row}</td>
                    <td className={TD}>
                      <b>{g.nama || '(tanpa nama)'}</b>
                      <div className="font-mono text-xs text-muted-foreground">{g.nik}</div>
                    </td>
                    <td className={TD}>
                      <div className="space-y-1.5">
                        {g.issues.map((i) => (
                          <div key={i.kind + (i.field ?? '')}>
                            <Tag tone={i.kind === 'same_name' ? 'info' : 'warn'}>{i.message}</Tag>
                            {i.kind === 'same_name' && i.merge_changes && Object.keys(i.merge_changes).length > 0 && (
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                Bila digabung: {Object.entries(i.merge_changes).map(([f, c]) => `${f}: ${c.old ?? '—'} → ${c.new}`).join('; ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className={TD}>
                      {g.forced ? (
                        <span className="text-xs text-muted-foreground">Dilewati otomatis</span>
                      ) : (
                        <select className={SELECT} value={current} onChange={(e) => onDecide(g.row, e.target.value)}>
                          <option value="default">{g.same ? 'Orang berbeda — simpan terpisah' : 'Simpan (kolom bermasalah diabaikan)'}</option>
                          {canMerge && <option value="merge">Orang yang sama — perbarui {g.same.existing?.[0]?.nik}</option>}
                          <option value="skip">Lewati baris</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function Kpi({ label, value, note }) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="px-3.5 py-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-display text-[27px] font-semibold leading-tight">{value}</p>
        <p className="text-[11.5px] text-muted-foreground">{note || '\u00A0'}</p>
      </CardContent>
    </Card>
  );
}

export function ConfirmStep({ report, labelOf }) {
  const c = report.counts ?? {};
  const changes = report.changes ?? [];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Kpi label="Karyawan baru" value={c.insert ?? 0} note={nameList((report.inserts ?? []).map((i) => i.nama))} />
        <Kpi label="Diperbarui" value={c.update ?? 0} note={nameList(changes.map((x) => x.nama))} />
        <Kpi label="Tidak berubah" value={c.unchanged ?? 0} />
        <Kpi label="Dilewati" value={c.skip ?? 0} />
      </div>

      {changes.length > 0 && (
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="p-4">
            <h3 className="mb-2 text-base font-semibold">Perubahan nilai (lama → baru)</h3>
            <div className="max-h-[360px] overflow-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead><tr><th className={TH}>Karyawan</th><th className={TH}>Field</th><th className={TH}>Lama</th><th className={TH}>Baru</th></tr></thead>
                <tbody>
                  {changes.map((x) => (
                    <tr key={`${x.row}-${x.field}`}>
                      <td className={TD}>{x.nama} <span className="font-mono text-xs text-muted-foreground">{x.nik}</span></td>
                      <td className={TD}>{labelOf[x.field] ?? x.field}</td>
                      <td className={TD}>{x.old ?? '—'}</td>
                      <td className={TD}><b>{x.new}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}