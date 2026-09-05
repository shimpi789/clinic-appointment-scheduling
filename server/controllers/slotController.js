import Slot from "../models/Slot.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";

// Helper: convert HH:MM into minutes
const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
};

// Helper: check whether two time ranges overlap
const isOverlapping = (
    startTime1,
    duration1,
    startTime2,
    duration2
) => {
    const start1 = timeToMinutes(startTime1);
    const end1 = start1 + duration1;

    const start2 = timeToMinutes(startTime2);
    const end2 = start2 + duration2;

    return start1 < end2 && start2 < end1;
};

// Helper: validate date string
const isValidDate = (date) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
};

// Helper: validate time string
const isValidTime = (time) => {
    return /^\d{2}:\d{2}$/.test(time);
};

// Create Slot
export const createSlot = async (req, res) => {
    try {
        const {
            providerId,
            date,
            startTime,
            duration,
        } = req.body;

        if (!providerId || !date || !startTime || !duration) {
            return res.status(400).json({
                message:
                    "Provider, date, start time and duration are required",
            });
        }

        // Provider can only create slots for themselves
        if (
            req.user.role === "PROVIDER" &&
            req.user.userId.toString() !== providerId.toString()
        ) {
            return res.status(403).json({
                message:
                    "Provider can only create slots for themselves",
            });
        }

        if (!isValidDate(date)) {
            return res.status(400).json({
                message:
                    "Date must be in YYYY-MM-DD format",
            });
        }

        if (!isValidTime(startTime)) {
            return res.status(400).json({
                message:
                    "Start time must be in HH:MM format",
            });
        }

        if (Number(duration) <= 0) {
            return res.status(400).json({
                message:
                    "Duration must be greater than zero",
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

        // Check actual time overlap
        const existingSlots = await Slot.find({
            providerId,
            date,
            archived: false,
        });

        const hasOverlap = existingSlots.some((slot) =>
            isOverlapping(
                startTime,
                Number(duration),
                slot.startTime,
                slot.duration
            )
        );

        if (hasOverlap) {
            return res.status(409).json({
                message:
                    "This slot overlaps with an existing slot",
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
        console.error(
            "Create slot error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while creating slot",
        });
    }
};

// Get My Slots
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
        console.error(
            "Get slots error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while fetching slots",
        });
    }
};

// Get Slots
export const getSlots = async (req, res) => {
    try {
        const { providerId, date, archived } = req.query;

        let filter = {};

        // By default, show active slots.
        // If archived=true, show archived slots.
        filter.archived = archived === "true";

        // Provider can only see their own slots.
        if (req.user.role === "PROVIDER") {
            filter.providerId = req.user.userId;
        }

        // Front desk can view slots for any provider,
        // but providerId is required.
        if (req.user.role === "FRONT_DESK") {
            if (!providerId) {
                return res.status(400).json({
                    message: "Provider is required",
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

            filter.providerId = providerId;
        }

        if (date) {
            filter.date = date;
        }

        const slots = await Slot.find(filter)
            .populate("providerId", "name email")
            .sort({
                date: 1,
                startTime: 1,
            });

        return res.status(200).json({
            slots,
        });
    } catch (error) {
        console.error(
            "Get slots error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while fetching slots",
        });
    }
};

// Update Slot
export const updateSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            date,
            startTime,
            duration,
        } = req.body;

        const slot = await Slot.findOne({
            _id: id,
            archived: false,
        });

        if (!slot) {
            return res.status(404).json({
                message: "Slot not found",
            });
        }

        // Provider can only edit their own slots
        if (
            req.user.role === "PROVIDER" &&
            slot.providerId.toString() !==
                req.user.userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "You can only edit your own slots",
            });
        }

        // A booked slot becomes an appointment
        // and cannot be edited.
        const existingAppointment = await Appointment.findOne({
            slotId: slot._id,
        });

        if (existingAppointment) {
            return res.status(400).json({
                message:
                    "Booked slots cannot be edited",
            });
        }

        if (!date || !startTime || !duration) {
            return res.status(400).json({
                message:
                    "Date, start time and duration are required",
            });
        }

        if (!isValidDate(date)) {
            return res.status(400).json({
                message:
                    "Date must be in YYYY-MM-DD format",
            });
        }

        if (!isValidTime(startTime)) {
            return res.status(400).json({
                message:
                    "Start time must be in HH:MM format",
            });
        }

        if (Number(duration) <= 0) {
            return res.status(400).json({
                message:
                    "Duration must be greater than zero",
            });
        }

        // Check overlap with other active slots
        const otherSlots = await Slot.find({
            providerId: slot.providerId,
            date,
            archived: false,
            _id: { $ne: slot._id },
        });

        const hasOverlap = otherSlots.some((existingSlot) =>
            isOverlapping(
                startTime,
                Number(duration),
                existingSlot.startTime,
                existingSlot.duration
            )
        );

        if (hasOverlap) {
            return res.status(409).json({
                message:
                    "Updated slot overlaps with an existing slot",
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
        console.error(
            "Update slot error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while updating slot",
        });
    }
};

// Archive Slot
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

        // Provider can only archive their own slots
        if (
            req.user.role === "PROVIDER" &&
            slot.providerId.toString() !==
                req.user.userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "You can only archive your own slots",
            });
        }

        // A booked slot has become an appointment
        // and should not be archived.
        const existingAppointment = await Appointment.findOne({
            slotId: slot._id,
        });

        if (existingAppointment) {
            return res.status(400).json({
                message:
                    "Booked slots cannot be archived",
            });
        }

        slot.archived = true;

        await slot.save();

        return res.status(200).json({
            message: "Slot archived successfully",
        });
    } catch (error) {
        console.error(
            "Archive slot error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while archiving slot",
        });
    }
};

// Restore Slot
export const restoreSlot = async (req, res) => {
    try {
        const { id } = req.params;

        const slot = await Slot.findOne({
            _id: id,
            archived: true,
        });

        if (!slot) {
            return res.status(404).json({
                message: "Archived slot not found",
            });
        }

        // Provider can only restore their own slots
        if (
            req.user.role === "PROVIDER" &&
            slot.providerId.toString() !==
                req.user.userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "You can only restore your own slots",
            });
        }

        // Check for overlap before restoring
        const activeSlots = await Slot.find({
            providerId: slot.providerId,
            date: slot.date,
            archived: false,
            _id: { $ne: slot._id },
        });

        const hasOverlap = activeSlots.some((existingSlot) =>
            isOverlapping(
                slot.startTime,
                slot.duration,
                existingSlot.startTime,
                existingSlot.duration
            )
        );

        if (hasOverlap) {
            return res.status(409).json({
                message:
                    "Slot cannot be restored because it overlaps with an active slot",
            });
        }

        slot.archived = false;

        await slot.save();

        return res.status(200).json({
            message: "Slot restored successfully",
            slot,
        });
    } catch (error) {
        console.error(
            "Restore slot error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while restoring slot",
        });
    }
};

// Bulk Generate Weekly Availability
export const bulkCreateSlots = async (req, res) => {
    try {
        const {
            providerId,
            startDate,
            endDate,
            weeklyBlocks,
        } = req.body;

        if (
            !providerId ||
            !startDate ||
            !endDate ||
            !Array.isArray(weeklyBlocks) ||
            weeklyBlocks.length === 0
        ) {
            return res.status(400).json({
                message:
                    "Provider, date range and weekly blocks are required",
            });
        }

        // Only front desk can generate availability
        if (req.user.role !== "FRONT_DESK") {
            return res.status(403).json({
                message:
                    "Only front desk can create bulk availability",
            });
        }

        if (
            !isValidDate(startDate) ||
            !isValidDate(endDate)
        ) {
            return res.status(400).json({
                message:
                    "Dates must be in YYYY-MM-DD format",
            });
        }

        if (startDate > endDate) {
            return res.status(400).json({
                message:
                    "Start date cannot be after end date",
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

        // Validate weekly blocks
        for (const block of weeklyBlocks) {
            if (
                block.dayOfWeek === undefined ||
                !block.startTime ||
                !block.duration
            ) {
                return res.status(400).json({
                    message:
                        "Each weekly block requires dayOfWeek, startTime and duration",
                });
            }

            if (
                Number(block.dayOfWeek) < 0 ||
                Number(block.dayOfWeek) > 6
            ) {
                return res.status(400).json({
                    message:
                        "dayOfWeek must be between 0 and 6",
                });
            }

            if (!isValidTime(block.startTime)) {
                return res.status(400).json({
                    message:
                        "Block start time must be in HH:MM format",
                });
            }

            if (Number(block.duration) <= 0) {
                return res.status(400).json({
                    message:
                        "Block duration must be greater than zero",
                });
            }
        }

        const created = [];
        const skipped = [];

        // Get existing active slots for the provider
        const existingSlots = await Slot.find({
            providerId,
            archived: false,
            date: {
                $gte: startDate,
                $lte: endDate,
            },
        });

        const currentDate = new Date(
            `${startDate}T00:00:00`
        );

        const finalDate = new Date(
            `${endDate}T00:00:00`
        );

        // Generate dates in the requested range
        while (currentDate <= finalDate) {
            const dateString = currentDate
                .toISOString()
                .split("T")[0];

            const dayOfWeek = currentDate.getUTCDay();

            const blocksForDay = weeklyBlocks.filter(
                (block) =>
                    Number(block.dayOfWeek) === dayOfWeek
            );

            for (const block of blocksForDay) {
                const hasExistingOverlap =
                    existingSlots.some(
                        (existingSlot) =>
                            existingSlot.date === dateString &&
                            isOverlapping(
                                block.startTime,
                                Number(block.duration),
                                existingSlot.startTime,
                                existingSlot.duration
                            )
                    );

                const hasCreatedOverlap =
                    created.some(
                        (createdSlot) =>
                            createdSlot.date === dateString &&
                            isOverlapping(
                                block.startTime,
                                Number(block.duration),
                                createdSlot.startTime,
                                createdSlot.duration
                            )
                    );

                if (
                    hasExistingOverlap ||
                    hasCreatedOverlap
                ) {
                    skipped.push({
                        date: dateString,
                        startTime: block.startTime,
                        duration: Number(block.duration),
                        reason:
                            "Collision with existing or generated slot",
                    });

                    continue;
                }

                const slot = await Slot.create({
                    providerId,
                    date: dateString,
                    startTime: block.startTime,
                    duration: Number(block.duration),
                });

                created.push(slot);
            }

            currentDate.setUTCDate(
                currentDate.getUTCDate() + 1
            );
        }

        return res.status(201).json({
            message:
                "Bulk availability generation completed",
            summary: {
                created: created.length,
                skipped: skipped.length,
            },
            created,
            skipped,
        });
    } catch (error) {
        console.error(
            "Bulk create slots error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while generating bulk availability",
        });
    }
};

// Export One Day Schedule as CSV
export const exportDayScheduleCsv = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                message: "Date is required",
            });
        }

        if (!isValidDate(date)) {
            return res.status(400).json({
                message:
                    "Date must be in YYYY-MM-DD format",
            });
        }

        const slots = await Slot.find({
            date,
        })
            .populate(
                "providerId",
                "name email"
            )
            .sort({
                startTime: 1,
            });

        const slotIds = slots.map(
            (slot) => slot._id
        );

        const appointments = await Appointment.find({
            slotId: {
                $in: slotIds,
            },
        });

        const appointmentMap = new Map();

        appointments.forEach((appointment) => {
            appointmentMap.set(
                appointment.slotId.toString(),
                appointment
            );
        });

        const csvEscape = (value) => {
            const stringValue =
                value === undefined ||
                value === null
                    ? ""
                    : String(value);

            return `"${stringValue.replace(
                /"/g,
                '""'
            )}"`;
        };

        const rows = [
            [
                "Date",
                "Start Time",
                "Duration",
                "Provider",
                "Provider Email",
                "Patient Name",
                "Status",
                "Cancellation Reason",
            ],
        ];

        slots.forEach((slot) => {
            const appointment =
                appointmentMap.get(
                    slot._id.toString()
                );

            rows.push([
                slot.date,
                slot.startTime,
                slot.duration,
                slot.providerId?.name || "",
                slot.providerId?.email || "",
                appointment?.patientName || "",
                appointment?.status || "AVAILABLE",
                appointment?.cancellationReason || "",
            ]);
        });

        const csv = rows
            .map((row) =>
                row
                    .map(csvEscape)
                    .join(",")
            )
            .join("\n");

        res.setHeader(
            "Content-Type",
            "text/csv"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="schedule-${date}.csv"`
        );

        return res.status(200).send(csv);
    } catch (error) {
        console.error(
            "Export CSV error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while exporting schedule",
        });
    }
};