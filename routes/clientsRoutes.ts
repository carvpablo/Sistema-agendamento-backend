import { Router } from "express";

import {
  getUserById,
  deleteUser,
  updateUser,
  getClientAppointments,
} from "../controllers/clientController";

const router = Router();

router.get("/:id/appointments", getClientAppointments);

router.get("/:id", getUserById);

router.patch("/:id", updateUser);

router.delete("/:id", deleteUser);

export default router;
