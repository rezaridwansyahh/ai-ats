import service from './attendance-setting.service.js';

const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

class AttendanceSettingController {
  getAll = handle(() => service.getAll());
  update = handle((req) => service.update(req.body));
}

export default new AttendanceSettingController();