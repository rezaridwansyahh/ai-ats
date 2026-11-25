import service from './attendance-event.service.js';

const handle = (fn, status = () => 200) => async (req, res) => {
  try {
    const result = await fn(req);
    res.status(status(result)).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

class AttendanceEventController {
  receive = handle((req) => service.receive(req.body), (r) => (r.duplicate ? 200 : 201));
  getClock = handle((req) => service.getClock(req.params.nik));
}

export default new AttendanceEventController();