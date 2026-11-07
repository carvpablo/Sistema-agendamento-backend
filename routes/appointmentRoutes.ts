import { Router } from "express";
import {
  createAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  getAppointmentById,
  getUserAppointments,
} from "../controllers/appointmentController";
import validateToken from "../middleware/validateToken";
import validateProfessional from "../middleware/validateProfessional";

const router = Router();

router.get("/", validateToken, getUserAppointments);

router.get("/:id", validateToken, getAppointmentById);

router.post("/", validateToken, createAppointment);

router.patch("/:id/cancel", validateToken, cancelAppointment);

router.patch(
  "/:id",
  validateToken,
  validateProfessional,
  updateAppointmentStatus,
);

export default router;
