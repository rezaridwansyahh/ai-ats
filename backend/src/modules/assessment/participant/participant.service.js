import Participant from './participant.model.js';

const EDITABLE_FIELDS = ['name', 'email', 'position', 'department', 'education', 'date_birth'];

class ParticipantService {
  async getAll() {
    return await Participant.getAll();
  }

  async getById(id) {
    const participant = await Participant.getById(id);
    if (!participant) throw { status: 404, message: 'Participant not found' };
    return participant;
  }

  async getByEmail(email) {
    if (!email) throw { status: 400, message: 'email is required' };
    const participant = await Participant.getByEmail(email);
    if (!participant) throw { status: 404, message: 'Participant not found' };
    return participant;
  }

  async create(name, email, position, department, education, date_birth) {
    if (!name || !email || !position || !department || !education || !date_birth) {
      throw { status: 400, message: 'name, email, position, department, education, and date_birth are required' };
    }

    const existing = await Participant.getByEmail(email);
    if (existing) throw { status: 409, message: 'Participant with this email already exists' };

    return await Participant.create({ name, email, position, department, education, date_birth });
  }

  async createByEmail({ name, email, position, department, education, date_birth }) {
    if (!name || !email || !position || !department || !education || !date_birth) {
      throw { status: 400, message: 'name, email, position, department, education, and date_birth are required' };
    }

    const existing = await Participant.getByEmail(email);
    if (existing) return existing;

    return await Participant.create({ name, email, position, department, education, date_birth });
  }

  async update(id, fields) {
    const participant = await Participant.getById(id);
    if (!participant) throw { status: 404, message: 'Participant not found' };

    const allowed = {};
    for (const key of EDITABLE_FIELDS) {
      if (fields[key] !== undefined) allowed[key] = fields[key];
    }

    if (Object.keys(allowed).length === 0) {
      throw { status: 400, message: 'No valid fields to update' };
    }

    if (allowed.email && allowed.email !== participant.email) {
      const clash = await Participant.getByEmail(allowed.email);
      if (clash && clash.id !== participant.id) {
        throw { status: 409, message: 'Participant with this email already exists' };
      }
    }

    return await Participant.update(id, allowed);
  }

  async delete(id) {
    const participant = await Participant.getById(id);
    if (!participant) throw { status: 404, message: 'Participant not found' };
    await Participant.delete(id);
    return participant;
  }
}

export default new ParticipantService();
