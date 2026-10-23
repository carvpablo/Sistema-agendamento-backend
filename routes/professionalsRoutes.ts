import { Router } from "express";
import {
  createProfessional,
  getProfessionalById,
  updateProfessional,
  deleteProfessional,
  createAvailability,
  getProfessionalAvailability,
  getProfessionalAvailableSlots,
  deleteAvailability,
  getProfessionalAppointments,
  getProfessionalServices,
} from "../controllers/professionalController";
import validateToken from "../middleware/validateToken";
import validateProfessional from "../middleware/validateProfessional";

const router = Router();

// Rota pública para consultar os serviços oferecidos por um profissional
router.get("/:id/services", getProfessionalServices);

// Rota para consultar disponibilidades do profissional
router.get("/:id/availability", getProfessionalAvailability);

// Rota pública para consultar slots de horários livres para um serviço
router.get("/:id/available-slots", getProfessionalAvailableSlots);

router.get("/:id", getProfessionalById);

router.get(
  "/:id/appointments",
  validateToken,
  validateProfessional,
  getProfessionalAppointments,
);

router.patch("/:id", validateToken, validateProfessional, updateProfessional);

router.delete("/:id", validateToken, validateProfessional, deleteProfessional);

router.post(
  "/availability",
  validateToken,
  validateProfessional,
  createAvailability,
);

router.delete(
  "/availability/:id",
  validateToken,
  validateProfessional,
  deleteAvailability,
);

export default router;
