import express from "express";
import DemoBookingController from "./demo-booking.controller.js";
import authToken from "../../shared/middleware/auth.middleware.js";

const router = express.Router();

router.post("/", DemoBookingController.create);  
router.get("/availability", DemoBookingController.getAvailability);     
router.get("/", authToken, DemoBookingController.getAll);                 
router.patch("/:id/approve", authToken, DemoBookingController.approve); 
router.patch("/:id/reject", authToken, DemoBookingController.reject);     
export default router;
