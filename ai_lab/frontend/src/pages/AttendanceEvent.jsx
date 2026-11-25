import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getEmployees } from '@/api/employees.api';
import { getAttendanceClock, sendAttendanceEvent } from '@/api/attendanceEvent.api';
import PageHead from '@/components/attendance/PageHead';
import PhonePreview from '@/components/attendance-event/PhonePreview';
import EventCard from '@/components/attendance-event/EventCard';

const errMsg = (err) => err?.response?.data?.message || err?.message || 'Terjadi kesalahan';

const getPosition = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ error: 'unavailable' });
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc_m: p.coords.accuracy }),
      (e) => resolve({ error: e.code === 1 ? 'denied' : 'unavailable' }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

export default function AttendanceEvent() {
  const [employees, setEmployees] = useState([]);
  const [nik, setNik] = useState('');
  const [clock, setClock] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    getEmployees()
      .then((res) => {
        const body = res.data;
        const rows = Array.isArray(body) ? body : body?.employees ?? body?.data ?? [];
        const active = rows.filter((e) => e.aktif === 'Aktif' && e.nik);
        setEmployees(active);
        setNik((prev) => prev || active[0]?.nik || '');
      })
      .catch((err) => setError(errMsg(err)));
  }, []);

  useEffect(() => {
    if (!nik) return undefined;
    let alive = true;
    getAttendanceClock(nik)
      .then((res) => { if (alive) { setClock(res.data); setError(null); } })
      .catch((err) => { if (alive) setError(errMsg(err)); });
    return () => { alive = false; };
  }, [nik]);

  const pick = (value) => {
    setClock(null);
    setLastEvent(null);
    setNik(value);
  };

  const punch = async () => {
    setBusy(true);
    try {
      const geo = await getPosition();
      const request = { nik, type: clock.next, ts: new Date().toISOString(), geo };
      const res = await sendAttendanceEvent(request);
      setLastEvent({ request, response: res.data });

      if (res.data.duplicate) toast('Absen yang sama sudah tercatat dalam 2 menit terakhir');
      else if (res.data.conflict) toast('Absen tercatat, tetapi rekap hari ini berasal dari sumber lain dan tidak diubah');
      else toast('Absen tercatat');

      const fresh = await getAttendanceClock(nik);
      setClock(fresh.data);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHead
        code="M3-07"
        title="Absen klik (PWA) — pratinjau integrasi"
        sub="Aplikasi absen klik + geo-tag sudah dibangun tim; layar ini menunjukkan data yang dikirim ke modul"
      />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="clock-employee" className="text-muted-foreground">Absen sebagai</label>
        <select
          id="clock-employee"
          value={nik}
          onChange={(e) => pick(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {employees.map((e) => (
            <option key={e.nik} value={e.nik}>{e.nama} ({e.nik})</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">Browser akan meminta izin lokasi saat absen.</span>
      </div>

      {error && <p className="text-sm text-destructive">Gagal memuat: {error}</p>}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <PhonePreview
          clock={clock}
          busy={busy}
          onPunch={punch}
          onLeave={() => toast('Form pengajuan → link persetujuan dikirim ke atasan')}
          onSaldo={() => toast('Coming soon')}
        />
        <EventCard lastEvent={lastEvent} />
      </div>
    </div>
  );
}