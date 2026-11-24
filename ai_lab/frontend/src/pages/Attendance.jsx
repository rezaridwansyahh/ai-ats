import { useNavigate } from 'react-router-dom';
import { getAttendanceHome } from '@/api/attendance.api';
import { fmtDate } from '@/components/dashboard/dashboardMetrics.js';
import { dec } from '@/components/karyawan/karyawanUtils.js';
import KpiCard from '@/components/dashboard/KpiCard';
import { useAttendance } from '@/components/attendance/useAttendance.js';
import PageHead from '@/components/attendance/PageHead';
import PageState from '@/components/attendance/PageState';
import AttendanceInsight from '@/components/attendance/AttendanceInsight';
import AttentionCard from '@/components/attendance/AttentionCard';
import MasukDataCard from '@/components/attendance/MasukDataCard';

export default function AttendanceHome() {
  const navigate = useNavigate();
  const { data, error, retry } = useAttendance(getAttendanceHome);

  if (error || !data) {
    return (
      <div>
        <PageHead code="M3-01" title="Kehadiran — ringkasan" />
        <PageState error={error} retry={retry} />
      </div>
    );
  }

  const { period, kpi, attention, insights } = data;
  const month = new Date(`${period.from}T00:00:00Z`).toLocaleDateString('id-ID', { month: 'long', timeZone: 'UTC' });

  return (
    <div className="space-y-4">
      <PageHead
        code="M3-01"
        title="Kehadiran — ringkasan"
        sub={`Periode ${fmtDate(period.from)} – ${fmtDate(period.to)} · ${period.workdays} hari kerja · ${period.employees} karyawan`}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Rata-rata % kehadiran" value={`${dec(kpi.pctHadir)}%`} sub="di luar cuti" onClick={() => navigate('/attendance/dashboard')} />
        <KpiCard label="Kejadian terlambat" value={String(kpi.lateEvents)} sub={`${kpi.lateMinutes} menit total`} onClick={() => navigate('/attendance/rekap')} />
        <KpiCard label="Perlu perhatian" value={String(kpi.needAttention)} sub="karyawan dengan ≥1 tanda" onClick={() => navigate('/attendance/rekap')} />
        <KpiCard label="Cuti menunggu persetujuan" value={kpi.pendingLeave == null ? '—' : String(kpi.pendingLeave)} sub="via link ke atasan" onClick={() => navigate('/attendance/cuti')} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <AttentionCard
          attention={attention}
          onOpen={(nik) => navigate(`/attendance/rekap/${nik}`)}
          onAll={() => navigate('/attendance/rekap')}
        />
        <div className="space-y-4">
          <AttendanceInsight title={`Insight kehadiran ${month}`} insights={insights} />
          <MasukDataCard onImport={() => navigate('/attendance/impor')} onClock={() => navigate('/attendance/absen')} />
        </div>
      </div>
    </div>
  );
}