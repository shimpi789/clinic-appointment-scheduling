import AppointmentHistory from "../models/AppointmentHistory.js";
import Appointment from "../models/Appointment.js";

export const getAppointmentHistory = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found",
            });
        }

        if (req.user.role === "PROVIDER") {
            const isSchedulingProvider =
                appointment.schedulingProviderId.toString() ===
                req.user.userId.toString();

            const isSupportingProvider =
                appointment.supportingProviderIds.some(
                    (id) =>
                        id.toString() === req.user.userId.toString()
                );

            if (!isSchedulingProvider && !isSupportingProvider) {
                return res.status(403).json({
                    message: "You cannot view this appointment history",
                });
            }
        }

        const history = await AppointmentHistory.find({
            appointmentId,
        })
            .populate("performedBy", "name email role")
            .populate("providerId", "name email")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            history,
        });
    } catch (error) {
        console.error("Get history error:", error.message);

        return res.status(500).json({
            message: "Server error while fetching history",
        });
    }
};