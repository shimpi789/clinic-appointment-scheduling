import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    createSlot,
    getMySlots,
    updateSlot,
    archiveSlot,
    restoreSlot,
    bulkCreateSlots,
    exportDayScheduleCsv,
} from "../controllers/slotController.js";

const router = express.Router();

// Create single slot
router.post(
    "/",
    authMiddleware,
    roleMiddleware("FRONT_DESK", "PROVIDER"),
    createSlot
);

// Get provider's own active slots
router.get(
    "/my",
    authMiddleware,
    roleMiddleware("PROVIDER"),
    getMySlots
);

// Bulk recurring availability
// Front desk only
router.post(
    "/bulk",
    authMiddleware,
    roleMiddleware("FRONT_DESK"),
    bulkCreateSlots
);

// Export one day's schedule as CSV
router.get(
    "/export",
    authMiddleware,
    roleMiddleware("FRONT_DESK", "PROVIDER"),
    exportDayScheduleCsv
);

// Update slot
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("FRONT_DESK", "PROVIDER"),
    updateSlot
);

// Archive slot
router.patch(
    "/:id/archive",
    authMiddleware,
    roleMiddleware("FRONT_DESK", "PROVIDER"),
    archiveSlot
);

// Restore archived slot
router.patch(
    "/:id/restore",
    authMiddleware,
    roleMiddleware("FRONT_DESK", "PROVIDER"),
    restoreSlot
);

export default router;