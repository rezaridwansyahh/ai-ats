import EmailNotifyModel from './email-notify.model.js'

class EmailNotifyService {
  async getAll() {
    return await EmailNotifyModel.getAll()
  }

  async getActive() {
    return await EmailNotifyModel.getActive()
  }

  async create(email, label) {
    if (!email || !email.trim()) throw { status: 400, message: 'Email is required' }
    return await EmailNotifyModel.create(email.trim(), label)
  }

  async update(id, fields) {
    const record = await EmailNotifyModel.getById(id)
    if (!record) throw { status: 404, message: 'Email notify not found' }
    return await EmailNotifyModel.update(id, fields)
  }

  async delete(id) {
    const record = await EmailNotifyModel.getById(id)
    if (!record) throw { status: 404, message: 'Email notify not found' }
    return await EmailNotifyModel.delete(id)
  }
}

export default new EmailNotifyService()
