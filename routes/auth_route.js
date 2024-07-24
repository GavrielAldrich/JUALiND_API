import express from "express";
import { userSession, userRegister, userLogin, userLogout } from "../controller/auth_controller.js";

var router = express.Router();

router.get("/getSession", userSession);
router.post("/login", userLogin);
router.post("/register", userRegister);
router.delete("/logout", userLogout);

export default router;