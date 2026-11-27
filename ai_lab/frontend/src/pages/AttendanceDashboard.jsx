import { useNavigate } from 'react-router-dom';
import { getAttendanceDashboard } from '@/api/attendance.api';
import { fmtDate } from '@/components/dashboard/dashboardMetrics.js';
import { dec } from '@/components/karyawan/karyawanUtils.js';
import KpiCard from '@/components/dashboard/KpiCard';
import TanyaDataCard from '@/components/dashboard/TanyaDataCard';
import { useAttendance } from '@/components/attendance/useAttendance.js';
import PageHead from '@/components/attendance/PageHead';
import PageState from '@/components/attendance/PageState';
import AttendanceInsight from '@/components/attendance/AttendanceInsight';
import StatusCard from '@/components/attendance-dashboard/StatusCard';
import PolaHariCard from '@/components/attendance-dashboard/PolaHariCard';
import TrenMingguanCard from '@/components/attendance-dashboard/TrenMingguanCard';
import DivisiTable from '@/components/attendance-dashboard/DivisiTable';

const ASK = [
  'Siapa terlambat ≥4 kali?',
  'Divisi dengan lembur tertinggi?',
  'Berapa kali sakit jatuh di hari Senin?',
  'Siapa yang sisa cutinya ≥ 8 hari?',
];

export default function AttendanceDashboard() {
  const navigate = useNavigate();
  const { data, error, retry } = useAttendance(getAttendanceDashboard);

  if (error || !data) {
    return (
      <div>
        <PageHead code="M3-05" title="Dashboard kehadiran & disiplin" />
        <PageState error={error} retry={retry} />
      </div>
    );
  }

  const { period, kpi, status, byWeekday, weekly, divisions, insights } = data;
  const toRekap = () => navigate(`/attendance/rekap?from=${period.from}&to=${period.to}`);
  
  return (
    <div className="space-y-4">
      <PageHead
        code="M3-05"
        title="Dashboard kehadiran & disiplin"
        sub={`Periode ${fmtDate(period.from)} – ${fmtDate(period.to)} · mengukur kehadiran dan disiplin waktu, bukan hasil kerja`}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiCard label="Karyawan" value={String(kpi.employees)} />
        <KpiCard label="% kehadiran" value={`${dec(kpi.pctHadir)}%`} sub="di luar cuti" />
        <KpiCard label="Kejadian terlambat" value={String(kpi.lateEvents)} onClick={toRekap} />
        <KpiCard label="Total lembur" value={`${dec(kpi.lembur)} jam`} />
        <KpiCard label="Sakit + Izin + Alpa" value={String(kpi.sia)} sub="hari" onClick={toRekap} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><AttendanceInsight title="Insight" insights={insights} /></div>
        <TanyaDataCard questions={ASK} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <StatusCard status={status} />
        <PolaHariCard byWeekday={byWeekday} />
        <TrenMingguanCard weekly={weekly} />
      </div>

      <DivisiTable divisions={divisions} />
    </div>
  );
}