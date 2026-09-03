import mongoose from "mongoose";

const visitNoteSchema = new mongoose.Schema(
    {
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            required: true,
        },

        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        text: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

visitNoteSchema.index({
    appointmentId: 1,
    createdAt: 1,
});

const VisitNote = mongoose.model("VisitNote", visitNoteSchema);

export default VisitNote;