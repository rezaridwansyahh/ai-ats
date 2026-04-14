import Instructor from './instructor.model.js';

const EDITABLE_FIELDS = ['name', 'email', 'position', 'department'];

class InstructorService {
  async getAll() {
    return await Instructor.getAll();
  }

  async getById(id) {
    const instructor = await Instructor.getById(id);
    if (!instructor) throw { status: 404, message: 'Instructor not found' };
    return instructor;
  }

  async getByEmail(email) {
    if (!email) throw { status: 400, message: 'email is required' };
    const instructor = await Instructor.getByEmail(email);
    if (!instructor) throw { status: 404, message: 'Instructor not found' };
    return instructor;
  }

  async create(name, email, position, department) {
    if (!name || !email || !position || !department) {
      throw { status: 400, message: 'name, email, position, and department are required' };
    }

    const existing = await Instructor.getByEmail(email);
    if (existing) throw { status: 409, message: 'Instructor with this email already exists' };

    return await Instructor.create({ name, email, position, department });
  }

  async update(id, fields) {
    const instructor = await Instructor.getById(id);
    if (!instructor) throw { status: 404, message: 'Instructor not found' };

    const allowed = {};
    for (const key of EDITABLE_FIELDS) {
      if (fields[key] !== undefined) allowed[key] = fields[key];
    }

    if (Object.keys(allowed).length === 0) {
      throw { status: 400, message: 'No valid fields to update' };
    }

    if (allowed.email && allowed.email !== instructor.email) {
      const clash = await Instructor.getByEmail(allowed.email);
      if (clash && clash.id !== instructor.id) {
        throw { status: 409, message: 'Instructor with this email already exists' };
      }
    }

    return await Instructor.update(id, allowed);
  }

  async delete(id) {
    const instructor = await Instructor.getById(id);
    if (!instructor) throw { status: 404, message: 'Instructor not found' };
    await Instructor.delete(id);
    return instructor;
  }
}

export default new InstructorService();
