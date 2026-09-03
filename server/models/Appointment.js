import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
    {
        slotId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Slot",
            required: true,
            unique: true,
        },

        patientName: {
            type: String,
            required: true,
            trim: true,
        },

        schedulingProviderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        supportingProviderIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        status: {
            type: String,
            enum: [
                "REQUESTED",
                "CONFIRMED",
                "CHECKED_IN",
                "COMPLETED",
                "NO_SHOW",
                "CANCELLED",
            ],
            default: "REQUESTED",
            required: true,
        },

        cancellationReason: {
            type: String,
            trim: true,
        },

        scheduledAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

appointmentSchema.index({
    patientName: "text",
});

appointmentSchema.index({
    schedulingProviderId: 1,
    status: 1,
    scheduledAt: 1,
});

appointmentSchema.index({
    supportingProviderIds: 1,
    scheduledAt: 1,
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;