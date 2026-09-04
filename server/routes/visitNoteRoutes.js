import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    addVisitNote,
    getVisitNotes,
    updateVisitNote,
} from "../controllers/visitNoteController.js";

const router = express.Router();

router.post(
    "/:appointmentId",
    authMiddleware,
    roleMiddleware("PROVIDER"),
    addVisitNote
);

router.get(
    "/:appointmentId",
    authMiddleware,
    roleMiddleware("FRONT_DESK", "PROVIDER"),
    getVisitNotes
);

router.put(
    "/note/:noteId",
    authMiddleware,
    roleMiddleware("PROVIDER"),
    updateVisitNote
);

export default router;