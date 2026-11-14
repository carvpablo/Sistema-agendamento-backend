"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const serviceController_1 = require("../controllers/serviceController");
const validateToken_1 = __importDefault(require("../middleware/validateToken"));
const validateProfessional_1 = __importDefault(require("../middleware/validateProfessional"));
const router = (0, express_1.Router)();
router.get("/", serviceController_1.getService);
router.get("/:id", serviceController_1.getServiceById);
router.post("/", validateToken_1.default, validateProfessional_1.default, serviceController_1.createService);
router.patch("/:id", validateToken_1.default, validateProfessional_1.default, serviceController_1.updateService);
router.delete("/:id", validateToken_1.default, validateProfessional_1.default, serviceController_1.deleteService);
exports.default = router;
