import Appointment from "../models/Appointment.js";
import AlertDismissal from "../models/AlertDismissal.js";

// Get alerts for the logged-in user
export const getAlerts = async (req, res) => {
    try {
        const now = new Date();

        // Appointment window:
        // Requested appointments within the next 24 hours
        const twentyFourHoursLater = new Date(
            now.getTime() + 24 * 60 * 60 * 1000
        );

        const filter = {
            status: "REQUESTED",
            scheduledAt: {
                $gte: now,
                $lte: twentyFourHoursLater,
            },
        };

        // Provider can only see appointments
        // where they are scheduling or supporting provider
        if (req.user.role === "PROVIDER") {
            filter.$or = [
                { schedulingProviderId: req.user.userId },
                { supportingProviderIds: req.user.userId },
            ];
        }

        const appointments = await Appointment.find(filter)
            .populate("schedulingProviderId", "name email")
            .populate("supportingProviderIds", "name email")
            .sort({ scheduledAt: 1 });

        const appointmentIds = appointments.map(
            (appointment) => appointment._id
        );

        // Find alerts dismissed by this user
        const dismissals = await AlertDismissal.find({
            appointmentId: { $in: appointmentIds },
            dismissedBy: req.user.userId,
        }).sort({ dismissedAt: -1 });

        const dismissedMap = new Map();

        for (const dismissal of dismissals) {
            if (!dismissedMap.has(dismissal.appointmentId.toString())) {
                dismissedMap.set(
                    dismissal.appointmentId.toString(),
                    dismissal.dismissedAt
                );
            }
        }

        const alerts = appointments.filter((appointment) => {
            const dismissedAt = dismissedMap.get(
                appointment._id.toString()
            );

            // Never dismissed
            if (!dismissedAt) {
                return true;
            }

            // If appointment is within 1 hour of scheduled time,
            // show the alert again even if it was dismissed earlier.
            const oneHourBefore = new Date(
                appointment.scheduledAt.getTime() - 60 * 60 * 1000
            );

            if (
                now >= oneHourBefore &&
                now < appointment.scheduledAt
            ) {
                return true;
            }

            // Otherwise keep it dismissed
            return false;
        });

        res.status(200).json({
            count: alerts.length,
            alerts,
        });
    } catch (error) {
        console.error("Get alerts error:", error);

        res.status(500).json({
            message: "Failed to fetch alerts",
        });
    }
};


// Dismiss an alert
export const dismissAlert = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found",
            });
        }

        if (appointment.status !== "REQUESTED") {
            return res.status(400).json({
                message: "Only requested appointments can be dismissed",
            });
        }

        // Provider can only dismiss alerts for their own care-team appointments
        if (req.user.role === "PROVIDER") {
            const isCareTeamMember =
                appointment.schedulingProviderId.toString() ===
                    req.user.userId ||
                appointment.supportingProviderIds.some(
                    (providerId) =>
                        providerId.toString() === req.user.userId
                );

            if (!isCareTeamMember) {
                return res.status(403).json({
                    message: "You can only dismiss alerts for your own appointments",
                });
            }
        }

        // Prevent duplicate dismissal records
        const existingDismissal = await AlertDismissal.findOne({
            appointmentId,
            dismissedBy: req.user.userId,
        });

        if (existingDismissal) {
            return res.status(200).json({
                message: "Alert already dismissed",
            });
        }

        await AlertDismissal.create({
            appointmentId,
            dismissedBy: req.user.userId,
        });

        res.status(200).json({
            message: "Alert dismissed successfully",
        });
    } catch (error) {
        console.error("Dismiss alert error:", error);

        res.status(500).json({
            message: "Failed to dismiss alert",
        });
    }
};