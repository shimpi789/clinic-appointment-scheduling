import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    getDashboard,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    roleMiddleware("FRONT_DESK", "PROVIDER"),
    getDashboard
);

export default router;