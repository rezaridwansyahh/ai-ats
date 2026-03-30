import express from 'express'
import EmailNotifyController from './email-notify.controller.js'
import authToken from '../../shared/middleware/auth.middleware.js'

const router = express.Router()

router.use(authToken)

router.get('/', EmailNotifyController.getAll)
router.post('/', EmailNotifyController.create)
router.patch('/:id', EmailNotifyController.update)
router.delete('/:id', EmailNotifyController.delete)

export default router
