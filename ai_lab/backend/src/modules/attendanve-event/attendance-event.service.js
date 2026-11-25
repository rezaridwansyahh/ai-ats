import model from './attendance-event.model.js';
import { reverseGeocode } from '../../shared/services/geocode.service.js';
import { isRealDate } from '../../shared/utils/date.util.js';

const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
const MAX_AGE_MS = 31 * 24 * 60 * 60 * 1000;

const bad = (message) => { throw { status: 400, message }; };
const isNum = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

function parseEvent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) bad('Send the event as a JSON object');

  const { nik, type, ts, site } = body;
  if (typeof nik !== 'string' || !nik.trim()) bad('nik is required');
  if (type !== 'in' && type !== 'out') bad("type must be 'in' or 'out'");
  if (typeof ts !== 'string' || !ISO_WITH_OFFSET.test(ts) || !isRealDate(ts.slice(0, 10)) || Number.isNaN(Date.parse(ts))) {
    bad('ts must be an ISO 8601 date-time with an offset, e.g. 2026-11-25T07:55:00+07:00');
  }
  const time = Date.parse(ts);
  if (time > Date.now() + FUTURE_TOLERANCE_MS) bad('ts is in the future');
  if (time < Date.now() - MAX_AGE_MS) bad('ts is older than 31 days');
  if (site != null && (typeof site !== 'string' || site.length > 50)) bad('site must be text of at most 50 characters');

  const geo = body.geo ?? {};
  if (typeof geo !== 'object' || Array.isArray(geo)) bad('geo must be an object');

  const out = {
    nik: nik.trim(), type, ts, site: site ?? null,
    lat: null, lng: null, accM: null, inside: null, distM: null,
    geoStatus: 'unavailable', 
  };

  if (geo.error != null) {
    if (geo.error !== 'denied' && geo.error !== 'unavailable') bad("geo.error must be 'denied' or 'unavailable'");
    out.geoStatus = geo.error;
  } else if (geo.lat != null || geo.lng != null) {
    if (!isNum(geo.lat, -90, 90) || !isNum(geo.lng, -180, 180)) bad('geo.lat and geo.lng must be valid coordinates');
    out.lat = geo.lat;
    out.lng = geo.lng;
  }

  if (geo.acc_m != null) {
    if (!isNum(geo.acc_m, 0, 100000)) bad('geo.acc_m must be a number of meters');
    out.accM = Math.round(geo.acc_m);
  }
  if (geo.inside != null) {
    if (typeof geo.inside !== 'boolean') bad('geo.inside must be true or false');
    out.inside = geo.inside;
    out.geoStatus = 'ok'; 
  }
  if (geo.dist_m != null) {
    if (!isNum(geo.dist_m, 0, 100000000)) bad('geo.dist_m must be a number of meters');
    out.distM = Math.round(geo.dist_m);
  }
  return out;
}

class AttendanceEventService {
  async receive(body) {
    const ev = parseEvent(body);

    const employee = await model.getEmployee(ev.nik);
    if (!employee) throw { status: 404, message: 'Employee not found' };
    if (employee.aktif !== 'Aktif') throw { status: 400, message: 'Employee is not active' };

    if (await model.isDuplicate(ev.nik, ev.type, ev.ts)) {
      return { duplicate: true, conflict: false };
    }

    let geoLabel = null;
    if (ev.lat != null) {
      try {
        geoLabel = await reverseGeocode(ev.lat, ev.lng);
        ev.geoStatus = geoLabel ? 'ok' : 'lookup_failed';
      } catch (err) {
        console.error('Geocoder lookup failed:', err.message); 
        ev.geoStatus = 'lookup_failed';
      }
    }

    const saved = await model.recordPunch({
      nik: ev.nik, ts: ev.ts, type: ev.type, site: ev.site, accM: ev.accM,
      inside: ev.inside, distM: ev.distM, geoStatus: ev.geoStatus, geoLabel,
    });
    if (saved.duplicate) return { duplicate: true, conflict: false };

    return {
      duplicate: false,
      conflict: saved.conflict, 
      tgl: saved.tgl,
      geo_status: ev.geoStatus,
      geo_label: geoLabel,
    };
  }

  async getClock(nik) {
    const employee = await model.getEmployee(nik);
    if (!employee || employee.aktif !== 'Aktif') throw { status: 404, message: 'Employee not found' };

    const [punches, today] = await Promise.all([model.getToday(nik), model.getTodayDate()]);
    const last = punches[punches.length - 1];
    return {
      employee: { nik: employee.nik, nama: employee.nama, jabatan: employee.jabatan, lokasi: employee.lokasi },
      today,
      punches,
      next: !last || last.type === 'out' ? 'in' : 'out',
    };
  }
}

export default new AttendanceEventService();