import VisitNote from "../models/VisitNote.js";
import Appointment from "../models/Appointment.js";
import { createHistory } from "../utils/history.js";

// Add Visit Note
export const addVisitNote = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                message: "Note text is required",
            });
        }

        const appointment =
            await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found",
            });
        }

        // Only providers can add visit notes
        if (req.user.role !== "PROVIDER") {
            return res.status(403).json({
                message: "Only providers can add visit notes",
            });
        }

        const isSchedulingProvider =
            appointment.schedulingProviderId.toString() ===
            req.user.userId.toString();

        const isSupportingProvider =
            appointment.supportingProviderIds.some(
                (id) =>
                    id.toString() ===
                    req.user.userId.toString()
            );

        if (!isSchedulingProvider && !isSupportingProvider) {
            return res.status(403).json({
                message:
                    "You are not part of this appointment's care team",
            });
        }

        const note = await VisitNote.create({
            appointmentId,
            providerId: req.user.userId,
            text: text.trim(),
        });

        // Record visit note addition in immutable history
        await createHistory({
            appointmentId: appointment._id,
            type: "VISIT_NOTE_ADDED",
            providerId: req.user.userId,
            performedBy: req.user.userId,
        });

        return res.status(201).json({
            message: "Visit note added successfully",
            note,
        });
    } catch (error) {
        console.error(
            "Add visit note error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while adding visit note",
        });
    }
};

// Get Visit Notes
export const getVisitNotes = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const appointment =
            await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found",
            });
        }

        // Providers can only view notes
        // for appointments in their care team.
        if (req.user.role === "PROVIDER") {
            const isSchedulingProvider =
                appointment.schedulingProviderId.toString() ===
                req.user.userId.toString();

            const isSupportingProvider =
                appointment.supportingProviderIds.some(
                    (id) =>
                        id.toString() ===
                        req.user.userId.toString()
                );

            if (!isSchedulingProvider && !isSupportingProvider) {
                return res.status(403).json({
                    message:
                        "You cannot view notes for this appointment",
                });
            }
        }

        const notes = await VisitNote.find({
            appointmentId,
        })
            .populate(
                "providerId",
                "name email"
            )
            .sort({ createdAt: 1 });

        return res.status(200).json({
            notes,
        });
    } catch (error) {
        console.error(
            "Get visit notes error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while fetching visit notes",
        });
    }
};

// Update Visit Note
export const updateVisitNote = async (req, res) => {
    try {
        const { noteId } = req.params;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                message: "Note text is required",
            });
        }

        const note = await VisitNote.findById(noteId);

        if (!note) {
            return res.status(404).json({
                message: "Visit note not found",
            });
        }

        // Only the provider who wrote the note
        // can edit it.
        if (
            note.providerId.toString() !==
            req.user.userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "Only the provider who wrote the note can edit it",
            });
        }

        note.text = text.trim();

        await note.save();

        return res.status(200).json({
            message: "Visit note updated successfully",
            note,
        });
    } catch (error) {
        console.error(
            "Update visit note error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while updating visit note",
        });
    }
};