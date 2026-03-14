import { Router } from "express"
import LandingController from "./landing.controller.js"
import authToken from "../../shared/middleware/auth.middleware.js"

const router = Router()

router.post("/", LandingController.create)
router.get("/availability", LandingController.getAvailability)
router.get("/", authToken, LandingController.getAll)
router.patch("/:id/approve", authToken, LandingController.approve)
router.patch("/:id/reject", authToken, LandingController.reject)

export default router
