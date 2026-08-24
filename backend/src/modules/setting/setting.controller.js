import SettingService from "./setting.service.js";

class SettingController {
  async get(req, res) {
    try {
      const data = await SettingService.get(req.user?.company_id, req.params.key);
      res.status(200).json({ message: 'Setting', data });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async save(req, res) {
    try {
      const data = await SettingService.save(req.user?.company_id, req.params.key, req.body?.value);
      res.status(200).json({ message: 'Setting saved', data });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new SettingController();
