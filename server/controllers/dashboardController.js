import Appointment from "../models/Appointment.js";

const getStartOfDay = (date) => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
};

const getEndOfDay = (date) => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
};

const getStartOfWeek = (date) => {
    const result = getStartOfDay(date);

    const day = result.getDay();

    // Monday = start of week
    const daysFromMonday = day === 0 ? 6 : day - 1;

    result.setDate(result.getDate() - daysFromMonday);

    return result;
};

export const getDashboard = async (req, res) => {
    try {
        const now = new Date();

        // Base visibility filter
        const visibilityFilter =
            req.user.role === "PROVIDER"
                ? {
                      $or: [
                          {
                              schedulingProviderId:
                                  req.user.userId,
                          },
                          {
                              supportingProviderIds:
                                  req.user.userId,
                          },
                      ],
                  }
                : {};

        // Today's date range
        const todayStart = getStartOfDay(now);
        const todayEnd = getEndOfDay(now);

        // Current week
        const weekStart = getStartOfWeek(now);

        // Today's appointments
        const todayAppointments =
            await Appointment.find({
                ...visibilityFilter,
                scheduledAt: {
                    $gte: todayStart,
                    $lte: todayEnd,
                },
            })
                .populate(
                    "schedulingProviderId",
                    "name email"
                )
                .populate(
                    "supportingProviderIds",
                    "name email"
                )
                .sort({
                    scheduledAt: 1,
                });

        // Currently checked in
        const currentlyCheckedIn =
            await Appointment.find({
                ...visibilityFilter,
                status: "CHECKED_IN",
            })
                .populate(
                    "schedulingProviderId",
                    "name email"
                )
                .populate(
                    "supportingProviderIds",
                    "name email"
                )
                .sort({
                    scheduledAt: 1,
                });

        // No-shows this week
        const noShowsThisWeek =
            await Appointment.find({
                ...visibilityFilter,
                status: "NO_SHOW",
                scheduledAt: {
                    $gte: weekStart,
                    $lte: now,
                },
            })
                .populate(
                    "schedulingProviderId",
                    "name email"
                )
                .sort({
                    scheduledAt: -1,
                });

        // Upcoming confirmed appointments
        const upcomingConfirmed =
            await Appointment.find({
                ...visibilityFilter,
                status: "CONFIRMED",
                scheduledAt: {
                    $gt: now,
                },
            })
                .populate(
                    "schedulingProviderId",
                    "name email"
                )
                .populate(
                    "supportingProviderIds",
                    "name email"
                )
                .sort({
                    scheduledAt: 1,
                })
                .limit(10);

        // Provider-wise breakdown
        const providerBreakdown =
            await Appointment.aggregate([
                {
                    $match: visibilityFilter,
                },
                {
                    $group: {
                        _id: "$schedulingProviderId",
                        total: {
                            $sum: 1,
                        },
                        requested: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$status",
                                            "REQUESTED",
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        confirmed: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$status",
                                            "CONFIRMED",
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        checkedIn: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$status",
                                            "CHECKED_IN",
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        completed: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$status",
                                            "COMPLETED",
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        noShow: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$status",
                                            "NO_SHOW",
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        cancelled: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$status",
                                            "CANCELLED",
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField:
                            "_id",
                        foreignField:
                            "_id",
                        as: "provider",
                    },
                },
                {
                    $unwind: {
                        path: "$provider",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        providerId: "$_id",
                        providerName:
                            "$provider.name",
                        providerEmail:
                            "$provider.email",
                        total: 1,
                        requested: 1,
                        confirmed: 1,
                        checkedIn: 1,
                        completed: 1,
                        noShow: 1,
                        cancelled: 1,
                    },
                },
                {
                    $sort: {
                        providerName: 1,
                    },
                },
            ]);

        // Status-wise breakdown
        const statusBreakdown =
            await Appointment.aggregate([
                {
                    $match: visibilityFilter,
                },
                {
                    $group: {
                        _id: "$status",
                        count: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        status: "$_id",
                        count: 1,
                    },
                },
                {
                    $sort: {
                        status: 1,
                    },
                },
            ]);

        // Last 8 weeks no-show rate
        const weeklyNoShowRate = [];

        for (let i = 7; i >= 0; i--) {
            const endOfWeek = new Date(
                weekStart
            );

            endOfWeek.setDate(
                endOfWeek.getDate() +
                    7
            );

            endOfWeek.setHours(
                23,
                59,
                59,
                999
            );

            endOfWeek.setDate(
                endOfWeek.getDate() -
                    i * 7
            );

            const startOfCurrentWeek =
                new Date(endOfWeek);

            startOfCurrentWeek.setDate(
                startOfCurrentWeek.getDate() -
                    6
            );

            startOfCurrentWeek.setHours(
                0,
                0,
                0,
                0
            );

            const nextWeek =
                new Date(
                    startOfCurrentWeek
                );

            nextWeek.setDate(
                nextWeek.getDate() + 7
            );

            const weeklyAppointments =
                await Appointment.find({
                    ...visibilityFilter,
                    scheduledAt: {
                        $gte: startOfCurrentWeek,
                        $lt: nextWeek,
                    },
                    status: {
                        $ne: "CANCELLED",
                    },
                }).select("status");

            const total =
                weeklyAppointments.length;

            const noShows =
                weeklyAppointments.filter(
                    (appointment) =>
                        appointment.status ===
                        "NO_SHOW"
                ).length;

            const rate =
                total === 0
                    ? 0
                    : Number(
                          (
                              (noShows /
                                  total) *
                              100
                          ).toFixed(2)
                      );

            weeklyNoShowRate.push({
                weekStart:
                    startOfCurrentWeek
                        .toISOString()
                        .split("T")[0],
                weekEnd: new Date(
                    nextWeek.getTime() -
                        1
                )
                    .toISOString()
                    .split("T")[0],
                totalAppointments:
                    total,
                noShows,
                noShowRate: rate,
            });
        }

        return res.status(200).json({
            summary: {
                todayAppointments:
                    todayAppointments.length,
                currentlyCheckedIn:
                    currentlyCheckedIn.length,
                noShowsThisWeek:
                    noShowsThisWeek.length,
                upcomingConfirmed:
                    upcomingConfirmed.length,
            },

            todayAppointments,

            currentlyCheckedIn,

            noShowsThisWeek,

            upcomingConfirmed,

            providerBreakdown,

            statusBreakdown,

            weeklyNoShowRate,
        });
    } catch (error) {
        console.error(
            "Dashboard error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while fetching dashboard",
        });
    }
};