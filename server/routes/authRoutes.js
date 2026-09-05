import express from "express";
import {
    register,
    login,
    getProviders,
} from "../controllers/authController.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/providers", getProviders);

export default router;