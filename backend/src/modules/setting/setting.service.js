import SettingModel from "./setting.model.js";

// Only these keys are allowed — this table is deliberately scoped to the
// Settings tabs that are pure toggle/preference state (Notifications,
// Candidate Portal, Theme). Anything else should get its own real table
// instead of being dumped into a generic key/value blob.
const ALLOWED_KEYS = ['notifications', 'candidate_portal', 'theme'];

const THEME_VALUES = ['light', 'dark', 'system'];
const ACCENT_VALUES = ['green', 'blue', 'amber', 'pink'];

function validateTheme(value) {
  if (value.theme !== undefined && !THEME_VALUES.includes(value.theme)) {
    throw { status: 400, message: `Invalid theme value: ${value.theme}` };
  }
  if (value.accent !== undefined && !ACCENT_VALUES.includes(value.accent)) {
    throw { status: 400, message: `Invalid accent value: ${value.accent}` };
  }
}

const KEY_VALIDATORS = {
  theme: validateTheme,
};

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

    KEY_VALIDATORS[key]?.(value);

    const row = await SettingModel.upsert(company_id, key, value);
    return row.value;
  }
}

export default new SettingService();