import instructorService from './instructor.service.js';

class InstructorController {
  async getAll(req, res) {
    try {
      const instructors = await instructorService.getAll();
      res.status(200).json({ message: 'List all instructors', instructors });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const instructor = await instructorService.getById(req.params.id);
      res.status(200).json({ message: 'Instructor found', instructor });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByEmail(req, res) {
    try {
      const instructor = await instructorService.getByEmail(req.params.email);
      res.status(200).json({ message: 'Instructor found', instructor });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const { name, email, position, department } = req.body;
      const instructor = await instructorService.create(name, email, position, department);
      res.status(201).json({ message: 'Instructor created', instructor });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const instructor = await instructorService.update(req.params.id, req.body);
      res.status(200).json({ message: 'Instructor updated', instructor });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const instructor = await instructorService.delete(req.params.id);
      res.status(200).json({ message: 'Instructor deleted', instructor });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new InstructorController();
