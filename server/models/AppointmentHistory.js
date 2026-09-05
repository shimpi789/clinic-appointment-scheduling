import mongoose from "mongoose";

const appointmentHistorySchema = new mongoose.Schema(
    {
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            required: true,
        },

        type: {
            type: String,
            enum: [
                "STATUS_CHANGE",
                "SUPPORTING_PROVIDER_ADDED",
                "SUPPORTING_PROVIDER_REMOVED",
                "SCHEDULING_PROVIDER_REASSIGNED",
                "CANCELLATION",
                "VISIT_NOTE_ADDED",
            ],
            required: true,
        },

        oldStatus: {
            type: String,
        },

        newStatus: {
            type: String,
        },

        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        reason: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

appointmentHistorySchema.index({
    appointmentId: 1,
    createdAt: 1,
});

const AppointmentHistory = mongoose.model(
    "AppointmentHistory",
    appointmentHistorySchema
);

export default AppointmentHistory;