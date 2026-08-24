import SettingModel from "./setting.model.js";

// Only these keys are allowed — this table is deliberately scoped to the
// Settings tabs that are pure toggle/preference state (Notifications,
// Candidate Portal). Anything else should get its own real table instead
// of being dumped into a generic key/value blob.
const ALLOWED_KEYS = ['notifications', 'candidate_portal'];

class SettingService {
  async get(company_id, key) {
    if (!company_id) throw { status: 400, message: 'company_id is required' };
    if (!ALLOWED_KEYS.includes(key)) throw { status: 400, message: `Unknown setting key: ${key}` };

    const row = await SettingModel.get(company_id, key);
    return row?.value ?? {};
  }

  async save(company_id, key, value) {
    if (!company_id) throw { status: 400, message: 'company_id is required' };
    if (!ALLOWED_KEYS.includes(key)) throw { status: 400, message: `Unknown setting key: ${key}` };
    if (value == null || typeof value !== 'object' || Array.isArray(value)) {
      throw { status: 400, message: 'value must be a JSON object' };
    }

    const row = await SettingModel.upsert(company_id, key, value);
    return row.value;
  }
}

export default new SettingService();
