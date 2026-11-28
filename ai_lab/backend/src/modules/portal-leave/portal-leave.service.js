import Model from './portal-leave.model.js';
import { workdays } from '../attendance-rekap/attendance-rekap.service.js';
import { isRealDate } from '../../shared/utils/date.util.js';
import leaveService from '../leave/leave.service.js';

const bad = (message) => ({ status: 400, message });

const DECISIONS = ['Disetujui', 'Ditolak'];
const DAY_STATUS = { 'Cuti tahunan': 'Cuti', Izin: 'Izin', Sakit: 'Sakit', 'Dinas Luar': 'Dinas Luar', WFH: 'WFH' };

const isTokenFormat = (s) =>
  typeof s === 'string' && /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(s);

function validateRow(row) {
  if (!row) throw { status: 404, message: 'Link tidak valid.' };
  if (!row.atasan_nik) throw { status: 403, message: 'Pengajuan ini belum memiliki atasan langsung.' };
  if (row.status !== 'Menunggu atasan') throw { status: 409, message: 'Pengajuan ini sudah diputuskan.' };
  if (row.expired) throw { status: 410, message: 'Link ini sudah kedaluwarsa.' };
}

async function holidaySet() {
  const list = await Model.getHolidays();
  return new Set((Array.isArray(list) ? list : []).filter(isRealDate));
}

async function load(token) {
  if (!isTokenFormat(token)) throw { status: 404, message: 'Link tidak valid.' };
  const row = await Model.getByToken(token);
  validateRow(row);
  return row;
}

class PortalLeaveService {
  async getByToken(token) {
    const row = await load(token);
    const days = workdays(row.tgl_mulai, row.tgl_selesai, await holidaySet());

    let saldo = null;
    if (row.jenis === 'Cuti tahunan') {
      const s = (await leaveService.getSaldoByNik(row.nik)).saldo;
      saldo = { berhak: s.berhak, sisa: s.berhak ? s.sisa : null };
    }

    return {
      karyawan: { nama: row.karyawan_nama, jabatan: row.jabatan, divisi: row.divisi },
      atasan: row.atasan_nama,
      jenis: row.jenis,
      tgl_mulai: row.tgl_mulai,
      tgl_selesai: row.tgl_selesai,
      hari_kerja: days.length,
      saldo,
      alasan: row.jenis === 'Sakit' ? null : row.alasan,
      token_expires_at: row.token_expires_at,
    };
  }

  async decide(token, body) {
    const keputusan = body?.keputusan;
    if (!DECISIONS.includes(keputusan)) throw bad(`keputusan must be one of: ${DECISIONS.join(', ')}`);
    const catatan = typeof body?.catatan === 'string' ? body.catatan.trim() || null : null;
    if (catatan && catatan.length > 255) throw bad('catatan must be at most 255 characters');

    const row = await load(token);
    const dates = keputusan === 'Disetujui' ? workdays(row.tgl_mulai, row.tgl_selesai, await holidaySet()) : [];

    return await Model.transaction(async (db) => {
      const decided = await Model.decide(db, row.id, { status: keputusan, catatan, decided_by: row.atasan_nik });
      if (!decided) throw { status: 409, message: 'Pengajuan ini sudah diputuskan atau link kedaluwarsa.' };

      const written = dates.length ? await Model.insertDays(db, row.nik, dates, DAY_STATUS[row.jenis]) : 0;
      return { keputusan, decided_at: decided.decided_at, hari_dicatat: written, hari_dilewati: dates.length - written };
    });
  }
}

export default new PortalLeaveService();