import { Router } from "express"
import LandingController from "./landing.controller.js"

const router = Router()

router.post("/", LandingController.create)

export default router
