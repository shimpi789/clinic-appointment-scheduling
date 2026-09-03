import mongoose from "mongoose";

const alertDismissalSchema = new mongoose.Schema(
    {
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            required: true,
        },

        dismissedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        dismissedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

alertDismissalSchema.index({
    appointmentId: 1,
    dismissedAt: -1,
});

const AlertDismissal = mongoose.model(
    "AlertDismissal",
    alertDismissalSchema
);

export default AlertDismissal;