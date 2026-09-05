import Slot from "../models/Slot.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { createHistory } from "../utils/history.js";

// Create Appointment
export const createAppointment = async (req, res) => {
    try {
        const { slotId, patientName } = req.body;

        if (!slotId || !patientName) {
            return res.status(400).json({
                message: "Slot and patient name are required",
            });
        }

        const slot = await Slot.findOne({
            _id: slotId,
            archived: false,
        });

        if (!slot) {
            return res.status(404).json({
                message: "Available slot not found",
            });
        }
        if (
            req.user.role === "PROVIDER" &&
            slot.providerId.toString() !== req.user.userId.toString()
        ) {
            return res.status(403).json({
                message: "You can only book appointments for your own slots",
            });
        }

        const provider = await User.findOne({
            _id: slot.providerId,
            role: "PROVIDER",
        });

        if (!provider) {
            return res.status(404).json({
                message: "Provider not found",
            });
        }

        const existingAppointment = await Appointment.findOne({
            slotId,
        });

        if (existingAppointment) {
            return res.status(409).json({
                message: "This slot is already booked",
            });
        }

        const scheduledAt = new Date(
            `${slot.date}T${slot.startTime}`
        );

        const appointment = await Appointment.create({
            slotId: slot._id,
            patientName: patientName.trim(),
            schedulingProviderId: slot.providerId,
            scheduledAt,
            status: "REQUESTED",
        });

        return res.status(201).json({
            message: "Appointment requested successfully",
            appointment,
        });
    } catch (error) {
        console.error("Create appointment error:", error.message);

        return res.status(500).json({
            message: "Server error while creating appointment",
        });
    }
};

// Get Appointments
export const getAppointments = async (req, res) => {
    try {
        const {
            search,
            providerId,
            status,
            startDate,
            endDate,
            sortBy = "date",
            sortOrder = "asc",
            page = 1,
            limit = 10,
        } = req.query;

        const conditions = [];

        // Provider can only see appointments
        // where they are scheduling or supporting provider.
        if (req.user.role === "PROVIDER") {
            conditions.push({
                $or: [
                    { schedulingProviderId: req.user.userId },
                    { supportingProviderIds: req.user.userId },
                ],
            });
        }

        // Search by patient name
        if (search && search.trim()) {
            conditions.push({
                patientName: {
                    $regex: search.trim(),
                    $options: "i",
                },
            });
        }

        // Filter by provider
        if (providerId) {
            conditions.push({
                $or: [
                    { schedulingProviderId: providerId },
                    { supportingProviderIds: providerId },
                ],
            });
        }

        // Filter by status
        if (status) {
            conditions.push({
                status,
            });
        }

        // Filter by date range
        if (startDate || endDate) {
            const dateFilter = {};

            if (startDate) {
                dateFilter.$gte = new Date(
                    `${startDate}T00:00:00`
                );
            }

            if (endDate) {
                dateFilter.$lte = new Date(
                    `${endDate}T23:59:59`
                );
            }

            conditions.push({
                scheduledAt: dateFilter,
            });
        }

        const filter =
            conditions.length > 0
                ? { $and: conditions }
                : {};

        // Allowed sorting fields
        const allowedSortFields = {
            date: "scheduledAt",
            status: "status",
            provider: "schedulingProviderId",
        };

        const sortField =
            allowedSortFields[sortBy] || "scheduledAt";

        const sortDirection =
            sortOrder === "desc" ? -1 : 1;

        // Pagination
        const pageNumber = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const pageLimit = Math.min(
            Math.max(parseInt(limit, 10) || 10, 1),
            50
        );

        const skip = (pageNumber - 1) * pageLimit;

        const [appointments, totalMatches] =
            await Promise.all([
                Appointment.find(filter)
                    .populate(
                        "schedulingProviderId",
                        "name email"
                    )
                    .populate(
                        "supportingProviderIds",
                        "name email"
                    )
                    .sort({
                        [sortField]: sortDirection,
                    })
                    .skip(skip)
                    .limit(pageLimit),

                Appointment.countDocuments(filter),
            ]);

        return res.status(200).json({
            appointments,
            pagination: {
                page: pageNumber,
                limit: pageLimit,
                totalMatches,
                totalPages: Math.ceil(
                    totalMatches / pageLimit
                ),
            },
        });
    } catch (error) {
        console.error(
            "Get appointments error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error while fetching appointments",
        });
    }
};

// Update Appointment Status
export const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "REQUESTED",
            "CONFIRMED",
            "CHECKED_IN",
            "COMPLETED",
            "NO_SHOW",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid appointment status",
            });
        }

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found",
            });
        }

        // Provider can only act on appointments
        // where they are scheduling or supporting provider.
        if (req.user.role === "PROVIDER") {
            const isSchedulingProvider =
                appointment.schedulingProviderId.toString() ===
                req.user.userId.toString();

            const isSupportingProvider =
                appointment.supportingProviderIds.some(
                    (providerId) =>
                        providerId.toString() ===
                        req.user.userId.toString()
                );

            if (!isSchedulingProvider && !isSupportingProvider) {
                return res.status(403).json({
                    message:
                        "You can only act on your own care team appointments",
                });
            }
        }

        const currentStatus = appointment.status;

        const validTransitions = {
            REQUESTED: ["CONFIRMED"],
            CONFIRMED: ["CHECKED_IN", "NO_SHOW"],
            CHECKED_IN: ["COMPLETED"],
            COMPLETED: [],
            NO_SHOW: [],
            CANCELLED: [],
        };

        if (
            !validTransitions[currentStatus].includes(status)
        ) {
            return res.status(400).json({
                message: `Invalid status transition from ${currentStatus} to ${status}`,
            });
        }

        // No-show is allowed only after scheduled time
        if (
            status === "NO_SHOW" &&
            new Date() < appointment.scheduledAt
        ) {
            return res.status(400).json({
                message:
                    "Appointment cannot be marked as no-show before scheduled time",
            });
        }

        const oldStatus = appointment.status;

        appointment.status = status;

        await appointment.save();

        // Create immutable history record
        await createHistory({
            appointmentId: appointment._id,
            type: "STATUS_CHANGE",
            oldStatus,
            newStatus: status,
            performedBy: req.user.userId,
        });

        return res.status(200).json({
            message: `Appointment status changed to ${status}`,
            appointment,
        });
    } catch (error) {
        console.error(
            "Update status error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while updating appointment status",
        });
    }
};

// Cancel Appointment
export const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                message: "Cancellation reason is required",
            });
        }

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found",
            });
        }

        // Provider can only cancel care team appointments
        if (req.user.role === "PROVIDER") {
            const isSchedulingProvider =
                appointment.schedulingProviderId.toString() ===
                req.user.userId.toString();

            const isSupportingProvider =
                appointment.supportingProviderIds.some(
                    (providerId) =>
                        providerId.toString() ===
                        req.user.userId.toString()
                );

            if (!isSchedulingProvider && !isSupportingProvider) {
                return res.status(403).json({
                    message:
                        "You can only cancel your care team appointments",
                });
            }
        }

        // Cancellation is not allowed after check-in
        if (
            appointment.status === "CHECKED_IN" ||
            appointment.status === "COMPLETED" ||
            appointment.status === "NO_SHOW" ||
            appointment.status === "CANCELLED"
        ) {
            return res.status(400).json({
                message:
                    "Appointment cannot be cancelled in its current status",
            });
        }

        const oldStatus = appointment.status;

        appointment.status = "CANCELLED";
        appointment.cancellationReason = reason.trim();

        await appointment.save();

        // Record status change
        await createHistory({
            appointmentId: appointment._id,
            type: "STATUS_CHANGE",
            oldStatus,
            newStatus: "CANCELLED",
            performedBy: req.user.userId,
        });

        // Record cancellation reason separately
        await createHistory({
            appointmentId: appointment._id,
            type: "CANCELLATION",
            performedBy: req.user.userId,
            reason: reason.trim(),
        });

        return res.status(200).json({
            message: "Appointment cancelled successfully",
            appointment,
        });
    } catch (error) {
        console.error(
            "Cancel appointment error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while cancelling appointment",
        });
    }
};

// Add Supporting Provider
export const addSupportingProvider = async (req, res) => {
    try {
        const { id } = req.params;
        const { providerId } = req.body;

        if (!providerId) {
            return res.status(400).json({
                message: "Provider ID is required",
            });
        }

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found",
            });
        }

        const provider = await User.findOne({
            _id: providerId,
            role: "PROVIDER",
        });

        if (!provider) {
            return res.status(404).json({
                message: "Provider not found",
            });
        }

        if (
            appointment.schedulingProviderId.toString() ===
            providerId.toString()
        ) {
            return res.status(400).json({
                message:
                    "Scheduling provider is already part of the appointment",
            });
        }

        const alreadySupporting =
            appointment.supportingProviderIds.some(
                (id) =>
                    id.toString() ===
                    providerId.toString()
            );

        if (alreadySupporting) {
            return res.status(409).json({
                message:
                    "Provider is already a supporting provider",
            });
        }

        appointment.supportingProviderIds.push(providerId);

        await appointment.save();

        // Record supporting provider addition
        await createHistory({
            appointmentId: appointment._id,
            type: "SUPPORTING_PROVIDER_ADDED",
            providerId,
            performedBy: req.user.userId,
        });

        return res.status(200).json({
            message:
                "Supporting provider added successfully",
            appointment,
        });
    } catch (error) {
        console.error(
            "Add supporting provider error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while adding supporting provider",
        });
    }
};

// Remove Supporting Provider
export const removeSupportingProvider = async (req, res) => {
    try {
        const { id, providerId } = req.params;

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found",
            });
        }

        const exists = appointment.supportingProviderIds.some(
            (id) =>
                id.toString() === providerId.toString()
        );

        if (!exists) {
            return res.status(404).json({
                message: "Supporting provider not found",
            });
        }

        appointment.supportingProviderIds =
            appointment.supportingProviderIds.filter(
                (id) =>
                    id.toString() !==
                    providerId.toString()
            );

        await appointment.save();

        // Record supporting provider removal
        await createHistory({
            appointmentId: appointment._id,
            type: "SUPPORTING_PROVIDER_REMOVED",
            providerId,
            performedBy: req.user.userId,
        });

        return res.status(200).json({
            message:
                "Supporting provider removed successfully",
            appointment,
        });
    } catch (error) {
        console.error(
            "Remove supporting provider error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while removing supporting provider",
        });
    }
};

// Reassign Scheduling Provider
export const reassignSchedulingProvider = async (req, res) => {
    try {
        const { id } = req.params;
        const { providerId } = req.body;

        if (req.user.role !== "FRONT_DESK") {
            return res.status(403).json({
                message:
                    "Only front desk can reassign the scheduling provider",
            });
        }

        if (!providerId) {
            return res.status(400).json({
                message: "Provider ID is required",
            });
        }

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found",
            });
        }

        // Terminal appointments cannot be reassigned.
        if (
            appointment.status === "COMPLETED" ||
            appointment.status === "NO_SHOW" ||
            appointment.status === "CANCELLED"
        ) {
            return res.status(400).json({
                message:
                    "Scheduling provider cannot be reassigned for a completed, no-show, or cancelled appointment",
            });
        }

        const provider = await User.findOne({
            _id: providerId,
            role: "PROVIDER",
        });

        if (!provider) {
            return res.status(404).json({
                message: "Provider not found",
            });
        }

        if (
            appointment.schedulingProviderId.toString() ===
            providerId.toString()
        ) {
            return res.status(400).json({
                message:
                    "Provider is already the scheduling provider",
            });
        }

        const oldProviderId = appointment.schedulingProviderId;

        appointment.schedulingProviderId = providerId;

        await appointment.save();

        await createHistory({
            appointmentId: appointment._id,
            type: "SCHEDULING_PROVIDER_REASSIGNED",
            providerId: providerId,
            performedBy: req.user.userId,
            reason: `Scheduling provider changed from ${oldProviderId} to ${providerId}`,
        });

        return res.status(200).json({
            message:
                "Scheduling provider reassigned successfully",
            appointment,
        });
    } catch (error) {
        console.error(
            "Reassign scheduling provider error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while reassigning scheduling provider",
        });
    }
};