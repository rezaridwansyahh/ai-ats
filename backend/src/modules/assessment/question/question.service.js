import Question from './question.model.js';

const EDITABLE_FIELDS = ['text', 'options', 'correct', 'points'];

class QuestionService {
  async getAll() {
    return await Question.getAll();
  }

  async getById(id) {
    const question = await Question.getById(id);
    if (!question) throw { status: 404, message: 'Question not found' };
    return question;
  }

  async create(text, options, correct, points) {
    if (!text || !options || correct === undefined || correct === null) {
      throw { status: 400, message: 'text, options, correct are required' };
    }

    if (!Array.isArray(options) || options.length < 2) {
      throw { status: 400, message: 'options must be an array with at least 2 items' };
    }

    if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
      throw { status: 400, message: 'correct must be a valid index within options' };
    }

    return await Question.create({ text, options, correct, points: points || 10 });
  }

  async update(id, fields) {
    const question = await Question.getById(id);
    if (!question) throw { status: 404, message: 'Question not found' };

    const allowed = {};
    for (const key of EDITABLE_FIELDS) {
      if (fields[key] !== undefined) allowed[key] = fields[key];
    }

    if (Object.keys(allowed).length === 0) {
      throw { status: 400, message: 'No valid fields to update' };
    }

    if (allowed.options !== undefined) {
      if (!Array.isArray(allowed.options) || allowed.options.length < 2) {
        throw { status: 400, message: 'options must be an array with at least 2 items' };
      }
      allowed.options = JSON.stringify(allowed.options);
    }

    return await Question.update(id, allowed);
  }

  async delete(id) {
    const question = await Question.getById(id);
    if (!question) throw { status: 404, message: 'Question not found' };
    await Question.delete(id);
    return question;
  }
}

export default new QuestionService();
