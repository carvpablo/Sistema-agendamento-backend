"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const professionalController_1 = require("../controllers/professionalController");
const validateToken_1 = __importDefault(require("../middleware/validateToken"));
const validateProfessional_1 = __importDefault(require("../middleware/validateProfessional"));
const router = (0, express_1.Router)();
// Rota pública para consultar os serviços oferecidos por um profissional
router.get("/:id/services", professionalController_1.getProfessionalServices);
// Rota para consultar disponibilidades do profissional
router.get("/:id/availability", professionalController_1.getProfessionalAvailability);
// Rota pública para consultar slots de horários livres para um serviço
router.get("/:id/available-slots", professionalController_1.getProfessionalAvailableSlots);
router.get("/:id", professionalController_1.getProfessionalById);
router.get("/:id/appointments", validateToken_1.default, validateProfessional_1.default, professionalController_1.getProfessionalAppointments);
router.patch("/:id", validateToken_1.default, validateProfessional_1.default, professionalController_1.updateProfessional);
router.delete("/:id", validateToken_1.default, validateProfessional_1.default, professionalController_1.deleteProfessional);
router.post("/availability", validateToken_1.default, validateProfessional_1.default, professionalController_1.createAvailability);
router.delete("/availability/:id", validateToken_1.default, validateProfessional_1.default, professionalController_1.deleteAvailability);
exports.default = router;
