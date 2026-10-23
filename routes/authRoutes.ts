import { Router } from "express";

import {
  signIn,
  logIn,
  logOut,
  signInProfessional,
  logInProfessional,
} from "../controllers/authController";

const router = Router();

router.post("/user/signin", signIn);

router.post("/user/login", logIn);

router.post("/logout", logOut);

router.post("/professional/signin", signInProfessional);

router.post("/professional/login", logInProfessional);

export default router;
