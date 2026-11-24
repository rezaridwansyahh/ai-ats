import model from './attendance-setting.model.js';
import { isRealDate } from '../../shared/utils/date.util.js';

const isTime = (v) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const isInt = (min, max) => (v) => Number.isInteger(v) && v >= min && v <= max;
const isNum = (min, max) => (v) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const isDateList = (v) => Array.isArray(v) && v.every(isRealDate);

const RULES = {
  jm:       { def: '08:00', ok: isTime,         msg: 'jm must be a time like 08:00' },
  jp:       { def: '17:00', ok: isTime,         msg: 'jp must be a time like 17:00' },
  tol:      { def: 10,      ok: isInt(0, 120),  msg: 'tol must be a whole number from 0 to 120 (minutes)' },
  ist:      { def: 1,       ok: isNum(0, 4),    msg: 'ist must be a number from 0 to 4 (hours)' },
  otMin:    { def: 30,      ok: isInt(0, 240),  msg: 'otMin must be a whole number from 0 to 240 (minutes)' },
  bLate:    { def: 4,       ok: isInt(1, 31),   msg: 'bLate must be a whole number from 1 to 31' },
  bBrad:    { def: 20,      ok: isNum(1, 1000), msg: 'bBrad must be a number from 1 to 1000' },
  bPct:     { def: 90,      ok: isNum(1, 100),  msg: 'bPct must be a number from 1 to 100' },
  bLupa:    { def: 2,       ok: isInt(1, 31),   msg: 'bLupa must be a whole number from 1 to 31' },
  holidays: { def: [],      ok: isDateList,     msg: 'holidays must be a list of dates in YYYY-MM-DD format' },
};

const toMinutes = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

class AttendanceSettingService {
  async getAll() {
    const saved = await model.getAll();
    const out = {};
    for (const [key, rule] of Object.entries(RULES)) out[key] = saved[key] ?? rule.def;
    return out;
  }

  async update(body) {
    const changes = body && typeof body === 'object' && !Array.isArray(body) ? { ...body } : null;
    if (!changes || Object.keys(changes).length === 0) {
      throw { status: 400, message: 'Send at least one setting to change' };
    }

    for (const [key, value] of Object.entries(changes)) {
      if (!RULES[key]) throw { status: 400, message: `Unknown setting: ${key}` };
      if (!RULES[key].ok(value)) throw { status: 400, message: RULES[key].msg };
    }
    if (changes.holidays) changes.holidays = [...new Set(changes.holidays)].sort();

    const merged = { ...(await this.getAll()), ...changes };
    if (toMinutes(merged.jp) <= toMinutes(merged.jm)) {
      throw { status: 400, message: 'jp (check-out time) must be later than jm (check-in time)' };
    }

    await model.upsertMany(changes);
    return this.getAll();
  }
}

export default new AttendanceSettingService();