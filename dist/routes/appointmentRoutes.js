"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appointmentController_1 = require("../controllers/appointmentController");
const validateToken_1 = __importDefault(require("../middleware/validateToken"));
const validateProfessional_1 = __importDefault(require("../middleware/validateProfessional"));
const router = (0, express_1.Router)();
router.get("/", validateToken_1.default, appointmentController_1.getUserAppointments);
router.get("/:id", validateToken_1.default, appointmentController_1.getAppointmentById);
router.post("/", validateToken_1.default, appointmentController_1.createAppointment);
router.patch("/:id/cancel", validateToken_1.default, appointmentController_1.cancelAppointment);
router.patch("/:id", validateToken_1.default, validateProfessional_1.default, appointmentController_1.updateAppointmentStatus);
exports.default = router;
