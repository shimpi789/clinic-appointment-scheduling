import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    getAppointmentHistory,
} from "../controllers/historyController.js";

const router = express.Router();

router.get(
    "/:appointmentId",
    authMiddleware,
    roleMiddleware("FRONT_DESK", "PROVIDER"),
    getAppointmentHistory
);

export default router;