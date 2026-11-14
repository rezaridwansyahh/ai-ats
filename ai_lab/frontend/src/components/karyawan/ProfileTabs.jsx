import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { daysBetween, fmtDate, REF_DATE } from '@/components/dashboard/dashboardMetrics.js';
import { Tag, WarnTag } from './EmployeeTags';
import { dec } from './karyawanUtils.js';
import { ageGroup, tenureGroup, CERT_WARN, PKWT_MAX } from './profileData.js';

const TH = 'border-b border-border bg-muted/60 px-3 py-2 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground';
const TD = 'border-b border-border/60 px-3 py-2';

function Panel({ title, tag, action, flush, children }) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className={flush ? 'p-0' : 'p-4'}>
        {title && (
          <div className={`mb-2 flex items-center gap-2 ${flush ? 'px-4 pt-4' : ''}`}>
            <h3 className="text-base font-semibold">{title}</h3>
            {tag && <Tag>{tag}</Tag>}
            <span className="flex-1" />
            {action}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

function Kv({ rows }) {
  return (
    <dl className="grid grid-cols-[150px_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="min-w-0 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Table({ head, children }) {
  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead><tr>{head.map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

const Note = ({ children, className = '' }) => <p className={`text-xs text-muted-foreground ${className}`}>{children}</p>;
const Mono = ({ children }) => <span className="font-mono text-[12.5px] tracking-wide">{children}</span>;

function Banner({ tone, children }) {
  return (
    <div className={`rounded-[10px] border px-3 py-2.5 text-[13px] ${tone === 'warn' ? 'border-[#f1d3a3] bg-warning/15' : 'border-border bg-muted/50'}`}>
      {children}
    </div>
  );
}

function Bar({ pct, warn }) {
  return (
    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
      <i className={`block h-full ${warn ? 'bg-[#d08a1c]' : 'bg-[#0D9276]'}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

/* ─── tabs ─── */
export function TabRingkasan({ e, p, isHr, onAskEss }) {
  const { X, cp, pen } = p;
  const prob = e.akhirProb
    ? (e.dalamProb ? `Berjalan, selesai ${fmtDate(e.akhirProb)}` : `Selesai ${fmtDate(e.akhirProb)}`)
    : 'Tidak berlaku';
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Data pribadi">
          <Kv rows={[
            ['Jenis kelamin', e.jk || '—'],
            ['Tempat, tgl lahir', `${X.tempat}, ${fmtDate(e.tgl_lahir)}`],
            ['Usia', `${e.usia ?? '—'} thn · ${ageGroup(e.usia)} · ${e.generasi || '—'}`],
            ['Pendidikan', e.pendidikan || '—'],
            ['Status PTKP', e.ptkp || '—'],
            ['Email kantor', e.email || '—'],
          ]} />
        </Panel>
        <Panel title="Sekilas">
          <Kv rows={[
            ['Masa kerja', `${dec(e.masa)} thn · ${tenureGroup(e.masa)}`],
            ['Status', `${e.status} · ${e.aktif}`],
            ...(e.warn ? [['Kontrak', <span key="w" className="flex items-center gap-1.5"><WarnTag warn={e.warn} /> {e.sisa} hari</span>]] : []),
            ['Masa percobaan', prob],
            ['Perkiraan pensiun', <>{pen ? fmtDate(pen) : '—'} <span className="text-xs text-muted-foreground">(usia pensiun JP)</span></>],
          ]} />
          <div className="mt-3">
            <div className="flex justify-between text-[12.5px]"><b>Kelengkapan data inti</b><span>{cp.pct}%</span></div>
            <Bar pct={cp.pct} />
            {cp.miss.length > 0 && <Note className="mt-1">Belum ada: {cp.miss.join(', ')}</Note>}
            <Note>
              Dokumen identitas 🔒: {cp.idn}/5 terisi
              {isHr && cp.idn < 5 && (
                <> · <button type="button" className="text-primary underline underline-offset-2" onClick={onAskEss}>Minta karyawan melengkapi</button></>
              )}
            </Note>
          </div>
        </Panel>
      </div>
      {isHr && e.cek.length > 0 && <Banner tone="warn">✎ Masalah kualitas data: {e.cek.join(' · ')}</Banner>}
    </div>
  );
}

export function TabPekerjaan({ e, boss, boss2 }) {
  return (
    <Panel>
      <Kv rows={[
        ['NIK internal', <Mono key="n">{e.nik}</Mono>],
        ['Jabatan', e.jabatan],
        ['Level', e.level],
        ['Divisi', e.divisi || '—'],
        ['Lokasi', e.lokasi],
        ['Atasan langsung', boss
          ? <><Link className="text-primary underline underline-offset-2" to={`/karyawan/${boss.id ?? boss.nik}`}>{boss.nama}</Link> · {boss.jabatan}</>
          : '—'],
        ['Atasan tidak langsung', boss2 ? `${boss2.nama} · ${boss2.jabatan}` : '—'],
      ]} />
      <div className="mt-3">
        <Banner>
          Fase 2 (usulan): struktur bertingkat Direktorat › Divisi › Departemen › Unit, grade/golongan, kode posisi, pusat biaya,
          dan penyetuju khusus (mis. atasan rangkap). Atasan tidak langsung dihitung otomatis dari rantai atasan — tidak perlu diisi manual.
        </Banner>
      </div>
    </Panel>
  );
}

export function TabKontrak({ e, p }) {
  const { C, pk, pen } = p;
  const tone = !pk ? '' : pk.st === 'Dalam batas' ? 'ok' : pk.st === 'Mendekati batas' ? 'warn' : 'crit';
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Kontrak saat ini">
          <Kv rows={[
            ['Status karyawan', e.status],
            ['Nomor kontrak', C.length ? <Mono key="c">{C[C.length - 1].no}</Mono> : '—'],
            ['Kontrak ke-', C.length || '—'],
            ['Tanggal masuk', fmtDate(e.tgl_masuk)],
            ['Akhir kontrak', e.akhir_kontrak
              ? <span key="a" className="flex flex-wrap items-center gap-1.5">{fmtDate(e.akhir_kontrak)} <WarnTag warn={e.warn} />{e.sisa != null && ` (${e.sisa} hari)`}</span>
              : '—'],
            ['Akhir masa percobaan', e.akhirProb ? fmtDate(e.akhirProb) : '—'],
            ['Perkiraan pensiun', pen ? fmtDate(pen) : '—'],
            ...(e.aktif === 'Keluar' ? [['Tanggal keluar', fmtDate(e.tgl_keluar)], ['Alasan keluar', e.alasan || '—']] : []),
          ]} />
        </Panel>
        <Panel title="Batas akumulasi PKWT">
          {pk ? (
            <>
              <div className="flex items-center justify-between text-[12.5px]">
                <span>{dec(pk.yrs)} dari {PKWT_MAX} tahun · {pk.n} kontrak</span>
                <Tag tone={tone}>{pk.st}</Tag>
              </div>
              <Bar pct={(100 * pk.yrs) / PKWT_MAX} warn={pk.st !== 'Dalam batas'} />
            </>
          ) : (
            <Note>Tidak berlaku (bukan PKWT).</Note>
          )}
          <Note className="mt-2">
            Batas di Pengaturan: {PKWT_MAX} tahun. PP 35/2021 (berlaku sekarang): total PKWT + perpanjangan ≤ 5 tahun.
            UU Pelindungan Ketenagakerjaan (disahkan DPR 6 Okt 2026, masa transisi 1 tahun): 2 tahun + maks. 2× perpanjangan @1 tahun = 4 tahun.
            Cek teks resmi &amp; aturan peralihan sebelum mengubah default.
          </Note>
        </Panel>
      </div>
      <Panel flush title="Riwayat kontrak" tag="contoh dari data template">
        <Table head={['Nomor', 'Jenis', 'Mulai', 'Berakhir', 'Keterangan']}>
          {C.length === 0 && <tr><td colSpan={5} className={`${TD} text-xs text-muted-foreground`}>Belum ada.</td></tr>}
          {C.map((c) => (
            <tr key={c.no}>
              <td className={TD}><Mono>{c.no}</Mono></td>
              <td className={TD}>{c.jenis}</td>
              <td className={TD}>{fmtDate(c.mulai)}</td>
              <td className={TD}>{c.akhir ? fmtDate(c.akhir) : '—'}</td>
              <td className={TD}>{c.ket}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}

export function TabKontak({ e, p, isHr }) {
  const em = p.X.em;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel title="Kontak kerja">
        <Kv rows={[
          ['Email kantor', e.email || '—'],
          ['Lokasi kerja', e.lokasi],
          ['No. HP 🔒', isHr ? 'lihat tab Data Sensitif' : 'disembunyikan'],
          ['Kanal notifikasi', <>Email <span className="text-xs text-muted-foreground">· WhatsApp/Telegram: Fase 2</span></>],
        ]} />
      </Panel>
      <Panel title="Kontak darurat">
        {!isHr ? (
          <Note>Disembunyikan untuk peran Manajer (data pribadi pihak ketiga). HR dapat membukanya bila diperlukan.</Note>
        ) : em ? (
          <>
            <Kv rows={[['Nama', em.nama], ['Hubungan', em.hub], ['Telepon', <Mono key="t">{em.hp}</Mono>]]} />
            <Note className="mt-2">Data pribadi pihak ketiga — disimpan terenkripsi, tidak dikirim ke AI.</Note>
          </>
        ) : (
          <>
            <Tag tone="warn">Belum diisi</Tag>
            <Note className="mt-2">Fase 2: karyawan mengisi sendiri lewat portal (PWA), HR menyetujui.</Note>
          </>
        )}
      </Panel>
    </div>
  );
}

export function TabPendidikan({ p, isHr, onScan }) {
  const { edu, tr } = p.X;
  return (
    <div className="space-y-4">
      <Panel flush title="Pendidikan formal" tag="contoh fiktif">
        <Table head={['Jenjang', 'Institusi', 'Jurusan', 'Lulus']}>
          {edu.length === 0 && <tr><td colSpan={4} className={`${TD} text-xs text-muted-foreground`}>Belum ada.</td></tr>}
          {edu.map((d) => (
            <tr key={d.j + d.th}><td className={TD}>{d.j}</td><td className={TD}>{d.ins}</td><td className={TD}>{d.jur}</td><td className={TD}>{d.th}</td></tr>
          ))}
        </Table>
      </Panel>
      <Panel
        flush
        title="Pelatihan & sertifikat"
        tag="contoh fiktif"
        action={isHr && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onScan}>📷 Scan sertifikat (10 kredit)</Button>}
      >
        <Table head={['Pelatihan', 'Penyelenggara', 'Tanggal', 'Sertifikat', 'Berlaku s.d.']}>
          {tr.map((t) => {
            const d = t.exp ? daysBetween(REF_DATE, t.exp) : null;
            return (
              <tr key={t.n}>
                <td className={TD}>{t.n}</td>
                <td className={TD}>{t.by}</td>
                <td className={TD}>{fmtDate(t.tgl)}</td>
                <td className={TD}>{t.cert ? <Mono>{t.no}</Mono> : '—'}</td>
                <td className={TD}>
                  {t.exp ? (
                    <span className="flex flex-wrap items-center gap-1.5">
                      {fmtDate(t.exp)}
                      {d < 0 ? <Tag tone="crit">⛔ Kedaluwarsa</Tag> : d <= CERT_WARN ? <Tag tone="warn">⚠ {d} hari</Tag> : null}
                    </span>
                  ) : t.cert ? 'Tanpa masa berlaku' : '—'}
                </td>
              </tr>
            );
          })}
        </Table>
        <Note className="px-4 pb-4 pt-2">
          Sertifikat yang masa berlakunya ≤ {CERT_WARN} hari muncul di Pengingat. Riwayat pengalaman kerja sebelumnya,
          penghargaan &amp; catatan disiplin: Fase 2.
        </Note>
      </Panel>
    </div>
  );
}

const SENSITIVE = [['No. HP', 'hp'], ['NIK KTP', 'ktp'], ['NPWP', 'npwp'], ['No. BPJS Ketenagakerjaan', 'bpjstk'], ['No. BPJS Kesehatan', 'bpjskes']];

export function TabSensitif({ e, revealed, onReveal }) {
  return (
    <Panel>
      <Banner tone="warn">🔒 Disimpan terenkripsi. Tidak pernah dikirim ke AI. Membuka data ini tercatat di jejak audit.</Banner>
      <div className="mt-3">
        <Kv rows={SENSITIVE.map(([label, key]) => [
          label,
          <Mono key={key}>{revealed ? (e[key] || <span className="text-xs text-muted-foreground">kosong di data contoh</span>) : '•••• •••• ••••'}</Mono>,
        ])} />
      </div>
      {!revealed && <Button className="mt-3" onClick={onReveal}>👁 Tampilkan (dicatat di audit)</Button>}
      <Note className="mt-3">
        Sengaja <b>tidak</b> disimpan di v1 (minimisasi data): nomor rekening bank, nomor KK, data anak, nomor asuransi kesehatan.
        Menurut UU PDP Pasal 4, data keuangan pribadi, data anak dan data kesehatan termasuk data pribadi spesifik;
        People Hub tidak mengurus payroll sehingga belum perlu menyimpannya.
      </Note>
    </Panel>
  );
}

export function TabDokumen({ p }) {
  return (
    <Panel flush>
      <Table head={['Dokumen', 'Sumber', 'Tanggal']}>
        <tr><td className={TD}>Formulir data karyawan (scan)</td><td className={TD}><Tag>contoh</Tag></td><td className={TD}>—</td></tr>
        {p.C.map((c) => (
          <tr key={c.no}>
            <td className={TD}>Perjanjian kerja {c.jenis} · <Mono>{c.no}</Mono></td>
            <td className={TD}><Tag>contoh</Tag></td>
            <td className={TD}>{fmtDate(c.mulai)}</td>
          </tr>
        ))}
      </Table>
      <Note className="p-4">Di prototipe, daftar dokumen hanya contoh struktur. Unggah dokumen memakai penyimpanan berkas ATS.</Note>
    </Panel>
  );
}

export function TabRiwayat({ p, access }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Panel title="Riwayat perubahan">
        <div className="space-y-3 border-l-2 border-border pl-4">
          {[...p.H].reverse().map((h) => (
            <div key={h.t + h.why}>
              <div className="text-[12.5px] font-semibold">
                Berlaku {h.eff ? fmtDate(h.eff) : '—'} {h.contoh && <Tag>contoh</Tag>}
              </div>
              {h.items.map(([field, from, to]) => (
                <div key={field} className="text-[13px]">
                  <b>{field}</b>: {from !== '—' && <><span className="text-muted-foreground line-through">{from}</span> → </>}{to}
                </div>
              ))}
              <Note>{h.why} · dicatat {h.t} oleh {h.who}</Note>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Akses data sensitif">
        {access.length ? access.map((a) => (
          <p key={a.t} className="border-b border-border/60 py-1 text-xs text-muted-foreground">{a.t} · {a.who}</p>
        )) : <Note>Belum pernah dibuka.</Note>}
        <Note className="mt-2">Log ini hanya bisa dibaca, tidak bisa diubah dari aplikasi.</Note>
      </Panel>
    </div>
  );
}