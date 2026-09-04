import Slot from "../models/Slot.js";
import User from "../models/User.js";

export const createSlot = async (req, res) => {
    try {
        const { providerId, date, startTime, duration } = req.body;

        if (!providerId || !date || !startTime || !duration) {
            return res.status(400).json({
                message: "Provider, date, start time and duration are required",
            });
        }

        if (req.user.role === "PROVIDER" &&
            req.user.userId.toString() !== providerId.toString()) {
            return res.status(403).json({
                message: "Provider can only create slots for themselves",
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

        const existingSlot = await Slot.findOne({
            providerId,
            date,
            startTime,
            archived: false,
        });

        if (existingSlot) {
            return res.status(409).json({
                message: "A slot already exists at this time",
            });
        }

        const slot = await Slot.create({
            providerId,
            date,
            startTime,
            duration,
        });

        return res.status(201).json({
            message: "Slot created successfully",
            slot,
        });
    } catch (error) {
        console.error("Create slot error:", error.message);

        return res.status(500).json({
            message: "Server error while creating slot",
        });
    }
};

export const getMySlots = async (req, res) => {
    try {
        const slots = await Slot.find({
            providerId: req.user.userId,
            archived: false,
        }).sort({
            date: 1,
            startTime: 1,
        });

        return res.status(200).json({
            slots,
        });
    } catch (error) {
        console.error("Get slots error:", error.message);

        return res.status(500).json({
            message: "Server error while fetching slots",
        });
    }
};

export const updateSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, startTime, duration } = req.body;

        const slot = await Slot.findOne({
            _id: id,
            archived: false,
        });

        if (!slot) {
            return res.status(404).json({
                message: "Slot not found",
            });
        }

        if (
            req.user.role === "PROVIDER" &&
            slot.providerId.toString() !== req.user.userId.toString()
        ) {
            return res.status(403).json({
                message: "You can only edit your own slots",
            });
        }

        if (!date || !startTime || !duration) {
            return res.status(400).json({
                message: "Date, start time and duration are required",
            });
        }

        slot.date = date;
        slot.startTime = startTime;
        slot.duration = duration;

        await slot.save();

        return res.status(200).json({
            message: "Slot updated successfully",
            slot,
        });
    } catch (error) {
        console.error("Update slot error:", error.message);

        return res.status(500).json({
            message: "Server error while updating slot",
        });
    }
};

export const archiveSlot = async (req, res) => {
    try {
        const { id } = req.params;

        const slot = await Slot.findOne({
            _id: id,
            archived: false,
        });

        if (!slot) {
            return res.status(404).json({
                message: "Slot not found",
            });
        }

        if (
            req.user.role === "PROVIDER" &&
            slot.providerId.toString() !== req.user.userId.toString()
        ) {
            return res.status(403).json({
                message: "You can only archive your own slots",
            });
        }

        slot.archived = true;
        await slot.save();

        return res.status(200).json({
            message: "Slot archived successfully",
        });
    } catch (error) {
        console.error("Archive slot error:", error.message);

        return res.status(500).json({
            message: "Server error while archiving slot",
        });
    }
};