import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    createSlot,
    getMySlots,
    updateSlot,
    archiveSlot,
} from "../controllers/slotController.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("FRONT_DESK", "PROVIDER"),
    createSlot
);

router.get(
    "/my",
    authMiddleware,
    roleMiddleware("PROVIDER"),
    getMySlots
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("FRONT_DESK", "PROVIDER"),
    updateSlot
);

router.patch(
    "/:id/archive",
    authMiddleware,
    roleMiddleware("FRONT_DESK", "PROVIDER"),
    archiveSlot
);

export default router;