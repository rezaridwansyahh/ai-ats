import EmailNotifyService from './email-notify.service.js'

class EmailNotifyController {
  async getAll(req, res) {
    try {
      const data = await EmailNotifyService.getAll()
      res.status(200).json({ data })
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message })
    }
  }

  async create(req, res) {
    try {
      const { email, label } = req.body
      const data = await EmailNotifyService.create(email, label)
      res.status(201).json({ message: 'Email added successfully', data })
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message })
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params
      const data = await EmailNotifyService.update(id, req.body)
      res.status(200).json({ message: 'Email updated successfully', data })
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message })
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params
      const data = await EmailNotifyService.delete(id)
      res.status(200).json({ message: 'Email deleted successfully', data })
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message })
    }
  }
}

export default new EmailNotifyController()
