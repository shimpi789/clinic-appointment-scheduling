import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    createAppointment,
    getAppointments,
    updateAppointmentStatus,
    cancelAppointment,
    addSupportingProvider,
    removeSupportingProvider,
} from "../controllers/appointmentController.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("FRONT_DESK", "PROVIDER"),
    createAppointment
);

router.get(
    "/",
    authMiddleware,
    roleMiddleware("FRONT_DESK", "PROVIDER"),
    getAppointments
);

router.patch(
    "/:id/status",
    authMiddleware,
    roleMiddleware("FRONT_DESK", "PROVIDER"),
    updateAppointmentStatus
);

router.patch(
    "/:id/cancel",
    authMiddleware,
    roleMiddleware("FRONT_DESK", "PROVIDER"),
    cancelAppointment
);

router.patch(
    "/:id/supporting-providers",
    authMiddleware,
    roleMiddleware("FRONT_DESK"),
    addSupportingProvider
);

router.delete(
    "/:id/supporting-providers/:providerId",
    authMiddleware,
    roleMiddleware("FRONT_DESK"),
    removeSupportingProvider
);

export default router;