import { Router } from "express";

import {
  createService,
  updateService,
  getService,
  getServiceById,
  deleteService,
} from "../controllers/serviceController";
import validateToken from "../middleware/validateToken";
import validateProfessional from "../middleware/validateProfessional";

const router = Router();

router.get("/", getService);

router.get("/:id", getServiceById);

router.post("/", validateToken, validateProfessional, createService);

router.patch("/:id", validateToken, validateProfessional, updateService);

router.delete("/:id", validateToken, validateProfessional, deleteService);

export default router;
