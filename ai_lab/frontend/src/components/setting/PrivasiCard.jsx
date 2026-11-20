import { useState } from 'react';
import { Eye, Lock, ScanLine, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

function Switch({ on, onToggle, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-muted-foreground/30'}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

function Item({ icon: Icon, tone, title, sub, children }) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 py-3 last:border-0">
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      {children}
    </div>
  );
}

export default function PrivasiCard() {
  const [ocr, setOcr] = useState(true);
  const [insight, setInsight] = useState(true);
  const [direksi, setDirektur] = useState(false);

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <h3 className="mb-1 text-sm font-semibold">AI &amp; data pribadi</h3>
        <Item
          icon={Lock}
          tone="bg-red-50 text-red-700"
          title="Field sensitif tidak dikirim ke AI"
          sub="No. HP, NIK KTP, NPWP, BPJS, Catatan. Terkunci, tidak bisa dimatikan."
        >
          <Badge variant="secondary">Selalu</Badge>
        </Item>
        <Item
          icon={ScanLine}
          tone="bg-amber-50 text-amber-700"
          title="Scan dokumen (OCR)"
          sub="Mengirim gambar ke layanan AI vision. Perlu persetujuan perusahaan."
        >
          <Switch on={ocr} onToggle={() => setOcr((v) => !v)} label="Scan dokumen" />
        </Item>
        <Item
          icon={Sparkles}
          tone="bg-violet-50 text-violet-700"
          title="Insight otomatis mingguan"
          sub="Diperbarui hanya jika data berubah."
        >
          <Switch on={insight} onToggle={() => setInsight((v) => !v)} label="Insight otomatis mingguan" />
        </Item>
        <Item
          icon={Eye}
          tone="bg-muted text-foreground"
          title="Direksi boleh membuka field sensitif"
          sub="Default: tidak (pertanyaan terbuka)."
        >
          <Switch on={direksi} onToggle={() => setDirektur((v) => !v)} label="Direksi membuka field sensitif" />
        </Item>
      </CardContent>
    </Card>
  );
}