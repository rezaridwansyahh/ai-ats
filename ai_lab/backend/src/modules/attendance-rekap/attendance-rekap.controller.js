import rekapService from './attendance-rekap.service.js';

class AttendanceRekapController {
  async getAll(req, res) {
    try {
      const result = await rekapService.getAll(req.query);
      res.status(200).json({ message: 'Attendance rekap', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByNik(req, res) {
    try {
      const result = await rekapService.getByNik(req.params.nik, req.query);
      res.status(200).json({ message: 'Attendance detail', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async exportXlsx(req, res) {
    try {
      const { buffer, filename } = await rekapService.exportXlsx(req.query);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new AttendanceRekapController();