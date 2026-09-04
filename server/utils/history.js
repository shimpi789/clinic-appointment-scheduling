import AppointmentHistory from "../models/AppointmentHistory.js";

export const createHistory = async ({
    appointmentId,
    type,
    oldStatus,
    newStatus,
    providerId,
    performedBy,
    reason,
}) => {
    await AppointmentHistory.create({
        appointmentId,
        type,
        oldStatus,
        newStatus,
        providerId,
        performedBy,
        reason,
    });
};