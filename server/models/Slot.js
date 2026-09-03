import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
    {
        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        date: {
            type: String,
            required: true,
        },

        startTime: {
            type: String,
            required: true,
        },

        duration: {
            type: Number,
            required: true,
            min: 1,
        },

        archived: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

slotSchema.index(
    {
        providerId: 1,
        date: 1,
        startTime: 1,
    },
    {
        unique: true,
        partialFilterExpression: {
            archived: false,
        },
    }
);

const Slot = mongoose.model("Slot", slotSchema);

export default Slot;