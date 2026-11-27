import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getAttendanceRekap, exportAttendanceRekap } from '@/api/attendance-rekap.api';
import { blobErrorMessage, downloadBlob, filenameFromHeader } from '@/components/karyawan/karyawanUtils.js';
import PageHead from '@/components/attendance/PageHead';
import PageState from '@/components/attendance/PageState';
import { RekapFilters, RekapTable } from '@/components/attendance-rekap/RekapList';

const errMsg = (err) => err?.response?.data?.message || err?.message || 'Gagal memuat rekap';

export default function AttendanceRekap() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const from = sp.get('from') ?? '';
  const to = sp.get('to') ?? '';

  const [sort, setSort] = useState('flag');
  const [divisi, setDivisi] = useState('');
  const [data, setData] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const params = { from: from || undefined, to: to || undefined, sort, divisi: divisi || undefined };

  useEffect(() => {
    let alive = true;
    setError(null);
    getAttendanceRekap({ from: from || undefined, to: to || undefined, sort, divisi: divisi || undefined })
      .then((res) => {
        if (!alive) return;
        const body = res.data?.data ?? res.data;
        setData(body);
        if (!divisi) setDivisions([...new Set(body.rekap.map((r) => r.divisi).filter(Boolean))].sort());
      })
      .catch((err) => { if (alive) setError(errMsg(err)); });
    return () => { alive = false; };
  }, [from, to, sort, divisi, reloadKey]);

  const changePeriod = (key, value) => {
    if (!value || !data) return;
    setSp({ from: from || data.period.from, to: to || data.period.to, [key]: value }, { replace: true });
  };

  const exportFile = async () => {
    setExporting(true);
    try {
      const res = await exportAttendanceRekap(params);
      downloadBlob(res.data, filenameFromHeader(res.headers['content-disposition']) ?? 'rekap_kehadiran.xlsx');
    } catch (err) {
      toast.error(await blobErrorMessage(err, 'Gagal mengekspor rekap'));
    } finally {
      setExporting(false);
    }
  };

  const open = (nik) =>
    navigate(`/attendance/rekap/${nik}?from=${data.period.from}&to=${data.period.to}`);

  return (
    <div className="space-y-4">
      <PageHead code="M3-03" title="Rekap per karyawan" sub="Semua karyawan · klik baris untuk kalender & detail" />

      <RekapFilters
        from={from || data?.period.from || ''}
        to={to || data?.period.to || ''}
        onPeriod={changePeriod}
        sort={sort}
        onSort={setSort}
        divisi={divisi}
        divisions={divisions}
        onDivisi={setDivisi}
        onExport={exportFile}
        exporting={exporting}
      />

      {error || !data
        ? <PageState error={error} retry={() => setReloadKey((k) => k + 1)} />
        : <RekapTable rekap={data.rekap} onOpen={open} />}
    </div>
  );
}