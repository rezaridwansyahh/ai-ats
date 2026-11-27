import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getAttendanceRekapDetail } from '@/api/attendance-rekap.api';
import PageHead from '@/components/attendance/PageHead';
import PageState from '@/components/attendance/PageState';
import { ProfileCard, CalendarCard, StatsCard, SaldoCard } from '@/components/attendance-rekap/DetailParts';

export default function AttendanceRekapDetail() {
  const { nik } = useParams();
  const [sp] = useSearchParams();
  const from = sp.get('from') ?? '';
  const to = sp.get('to') ?? '';

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(null);
    getAttendanceRekapDetail(nik, { from: from || undefined, to: to || undefined })
      .then((res) => { if (alive) setData(res.data?.data ?? res.data); })
      .catch((err) => {
        if (alive) setError(err?.response?.data?.message || err?.message || 'Gagal memuat detail');
      });
    return () => { alive = false; };
  }, [nik, from, to, reloadKey]);

  const back = (
    <div className="mb-2">
      <Link to={`/attendance/rekap${sp.toString() ? `?${sp}` : ''}`} className="text-sm text-primary underline underline-offset-2">
        ← Rekap
      </Link>
    </div>
  );

  if (error || !data) {
    return (
      <div>
        {back}
        <PageHead code="M3-04" title="Detail kehadiran" />
        <PageState error={error} retry={() => setReloadKey((k) => k + 1)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        {back}
        <PageHead code="M3-04" title="Detail kehadiran" />
      </div>

      <ProfileCard employee={data.employee} rekap={data.rekap} onTalk={() => toast('Coming soon')} />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <CalendarCard period={data.period} kalender={data.kalender} />
        <div className="space-y-4">
          <StatsCard rekap={data.rekap} />
          <SaldoCard />
        </div>
      </div>
    </div>
  );
}