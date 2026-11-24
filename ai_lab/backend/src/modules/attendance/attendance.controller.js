import service from './attendance.service.js';

const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

class AttendanceController {
  home = handle((req) => service.home(req.query));
  dashboard = handle((req) => service.dashboard(req.query));
  recap = handle((req) => service.recap(req.query));
}

export default new AttendanceController();