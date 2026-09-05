import { useCallback, useEffect, useState } from "react";
import {
    getAppointments,
    createAppointment,
    updateAppointmentStatus,
    cancelAppointment,
} from "../services/appointmentService";
import {
    getSlots,
} from "../services/slotService";
import { getProviders } from "../services/authService";
import { useAuth } from "../context/useAuth";
import "../styles/appointments.css";

const Appointments = () => {
    const { user } = useAuth();

    const [appointments, setAppointments] = useState([]);
    const [providers, setProviders] = useState([]);
    const [slots, setSlots] = useState([]);

    const [loading, setLoading] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Create appointment form
    const [patientName, setPatientName] = useState("");
    const [selectedProvider, setSelectedProvider] =
        useState("");
    const [appointmentDate, setAppointmentDate] =
        useState("");
    const [selectedSlot, setSelectedSlot] = useState("");

    // Filters
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [page, setPage] = useState(1);

    const [pagination, setPagination] = useState({
        totalMatches: 0,
        totalPages: 1,
    });

    /*
     * Load appointments.
     * Pagination and filtering happen on the server.
     */
    const fetchAppointments = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAppointments({
                search,
                status,
                startDate: fromDate,
                endDate: toDate,
                page,
                limit: 10,
            });

            setAppointments(data.appointments || []);

            setPagination({
                totalMatches:
                    data.pagination?.totalMatches || 0,
                totalPages:
                    data.pagination?.totalPages || 1,
            });
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [search, status, fromDate, toDate, page]);

    useEffect(() => {
        // Loading appointments from the API is intentional here.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchAppointments();
    }, [fetchAppointments]);

    /*
     * Load providers for Front Desk.
     */
    const fetchProviders = useCallback(async () => {
        if (user?.role !== "FRONT_DESK") {
            return;
        }

        try {
            const data = await getProviders();

            setProviders(data.providers || []);
        } catch (error) {
            setError(error.message);
        }
    }, [user]);

    useEffect(() => {
        // Loading providers from the API is intentional here.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchProviders();
    }, [fetchProviders]);

    /*
     * Load available slots whenever provider/date changes.
     */
    const fetchSlots = useCallback(async () => {
        if (!appointmentDate) {
            setSlots([]);
            return;
        }

        if (
            user?.role === "FRONT_DESK" &&
            !selectedProvider
        ) {
            setSlots([]);
            return;
        }

        try {
            setSlotsLoading(true);
            setError("");

            const params = {
                date: appointmentDate,
            };

            if (user?.role === "FRONT_DESK") {
                params.providerId = selectedProvider;
            }

            const data = await getSlots(params);

            setSlots(data.slots || []);
        } catch (error) {
            setError(error.message);
        } finally {
            setSlotsLoading(false);
        }
    }, [user, selectedProvider, appointmentDate]);

    useEffect(() => {
        // Loading available slots from the API is intentional here.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchSlots();
    }, [fetchSlots]);

    const handleCreateAppointment = async (event) => {
        event.preventDefault();

        try {
            setError("");
            setSuccess("");

            if (!selectedSlot) {
                setError("Please select an available slot.");
                return;
            }

            await createAppointment({
                slotId: selectedSlot,
                patientName: patientName.trim(),
            });

            setSuccess(
                "Appointment requested successfully."
            );

            setPatientName("");
            setSelectedSlot("");

            await fetchAppointments();
            await fetchSlots();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleStatusChange = async (
        appointmentId,
        nextStatus
    ) => {
        try {
            setError("");
            setSuccess("");

            await updateAppointmentStatus(
                appointmentId,
                nextStatus
            );

            setSuccess(
                `Appointment status changed to ${formatStatus(
                    nextStatus
                )}.`
            );

            await fetchAppointments();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleCancel = async (appointmentId) => {
        const reason = window.prompt(
            "Enter cancellation reason:"
        );

        if (!reason || !reason.trim()) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await cancelAppointment(
                appointmentId,
                reason.trim()
            );

            setSuccess(
                "Appointment cancelled successfully."
            );

            await fetchAppointments();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleClearFilters = () => {
        setSearch("");
        setStatus("");
        setFromDate("");
        setToDate("");
        setPage(1);
    };

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    const formatTime = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    const formatStatus = (value) => {
        return value
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    const getNextActions = (appointment) => {
        switch (appointment.status) {
            case "REQUESTED":
                return [
                    {
                        status: "CONFIRMED",
                        label: "Confirm",
                    },
                ];

            case "CONFIRMED":
                return [
                    {
                        status: "CHECKED_IN",
                        label: "Check In",
                    },
                    {
                        status: "NO_SHOW",
                        label: "No Show",
                    },
                ];

            case "CHECKED_IN":
                return [
                    {
                        status: "COMPLETED",
                        label: "Complete",
                    },
                ];

            default:
                return [];
        }
    };

    return (
        <div className="appointments-page">
            <div className="page-header">
                <div>
                    <h2>Appointments</h2>

                    <p>
                        Manage clinic appointments
                        {user?.role === "PROVIDER"
                            ? " assigned to your care team."
                            : "."}
                    </p>
                </div>
            </div>

            {/* Create Appointment */}

            <div className="appointment-create-card">
                <div className="card-header">
                    <div>
                        <h3>Create Appointment</h3>

                        <span>
                            Select a patient and an available
                            appointment slot.
                        </span>
                    </div>
                </div>

                <form
                    onSubmit={handleCreateAppointment}
                    className="appointment-create-form"
                >
                    <div className="appointment-create-grid">
                        <div className="filter-group">
                            <label htmlFor="patientName">
                                Patient Name
                            </label>

                            <input
                                id="patientName"
                                type="text"
                                value={patientName}
                                onChange={(event) =>
                                    setPatientName(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter patient name"
                                required
                            />
                        </div>

                        {user?.role === "FRONT_DESK" && (
                            <div className="filter-group">
                                <label htmlFor="appointmentProvider">
                                    Provider
                                </label>

                                <select
                                    id="appointmentProvider"
                                    value={selectedProvider}
                                    onChange={(event) => {
                                        setSelectedProvider(
                                            event.target.value
                                        );
                                        setSelectedSlot("");
                                    }}
                                    required
                                >
                                    <option value="">
                                        Select provider
                                    </option>

                                    {providers.map(
                                        (provider) => (
                                            <option
                                                key={
                                                    provider._id
                                                }
                                                value={
                                                    provider._id
                                                }
                                            >
                                                {provider.name}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        )}

                        <div className="filter-group">
                            <label htmlFor="appointmentDate">
                                Date
                            </label>

                            <input
                                id="appointmentDate"
                                type="date"
                                value={appointmentDate}
                                onChange={(event) => {
                                    setAppointmentDate(
                                        event.target.value
                                    );
                                    setSelectedSlot("");
                                }}
                                required
                            />
                        </div>

                        <div className="filter-group">
                            <label htmlFor="appointmentSlot">
                                Available Slot
                            </label>

                            <select
                                id="appointmentSlot"
                                value={selectedSlot}
                                onChange={(event) =>
                                    setSelectedSlot(
                                        event.target.value
                                    )
                                }
                                required
                                disabled={
                                    slotsLoading ||
                                    !appointmentDate ||
                                    (user?.role ===
                                        "FRONT_DESK" &&
                                        !selectedProvider)
                                }
                            >
                                <option value="">
                                    {slotsLoading
                                        ? "Loading slots..."
                                        : "Select a slot"}
                                </option>

                                {slots.map((slot) => (
                                    <option
                                        key={slot._id}
                                        value={slot._id}
                                    >
                                        {slot.startTime} —{" "}
                                        {slot.duration} min
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="create-appointment-action">
                            <button
                                type="submit"
                                className="primary-button"
                            >
                                Request Appointment
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {success && (
                <div className="success-message">
                    {success}
                </div>
            )}

            {/* Filters */}

            <div className="filters-card">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        setPage(1);
                    }}
                >
                    <div className="filter-row">
                        <div className="filter-group search-group">
                            <label htmlFor="search">
                                Patient
                            </label>

                            <input
                                id="search"
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search patient name"
                            />
                        </div>

                        <div className="filter-group">
                            <label htmlFor="status">
                                Status
                            </label>

                            <select
                                id="status"
                                value={status}
                                onChange={(event) => {
                                    setStatus(
                                        event.target.value
                                    );
                                    setPage(1);
                                }}
                            >
                                <option value="">
                                    All statuses
                                </option>
                                <option value="REQUESTED">
                                    Requested
                                </option>
                                <option value="CONFIRMED">
                                    Confirmed
                                </option>
                                <option value="CHECKED_IN">
                                    Checked In
                                </option>
                                <option value="COMPLETED">
                                    Completed
                                </option>
                                <option value="NO_SHOW">
                                    No Show
                                </option>
                                <option value="CANCELLED">
                                    Cancelled
                                </option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="fromDate">
                                From
                            </label>

                            <input
                                id="fromDate"
                                type="date"
                                value={fromDate}
                                onChange={(event) => {
                                    setFromDate(
                                        event.target.value
                                    );
                                    setPage(1);
                                }}
                            />
                        </div>

                        <div className="filter-group">
                            <label htmlFor="toDate">
                                To
                            </label>

                            <input
                                id="toDate"
                                type="date"
                                value={toDate}
                                onChange={(event) => {
                                    setToDate(
                                        event.target.value
                                    );
                                    setPage(1);
                                }}
                            />
                        </div>

                        <div className="filter-actions">
                            <button type="submit">
                                Search
                            </button>

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={
                                    handleClearFilters
                                }
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Appointment List */}

            <div className="appointments-card">
                <div className="card-header">
                    <div>
                        <h3>Appointment List</h3>

                        <span>
                            {pagination.totalMatches} total
                            matches
                        </span>
                    </div>
                </div>

                {loading && (
                    <div className="state-message">
                        Loading appointments...
                    </div>
                )}

                {!loading &&
                    appointments.length === 0 && (
                        <div className="state-message">
                            No appointments found.
                        </div>
                    )}

                {!loading &&
                    appointments.length > 0 && (
                        <>
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Patient</th>
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>
                                                Scheduling
                                                Provider
                                            </th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {appointments.map(
                                            (appointment) => {
                                                const actions =
                                                    getNextActions(
                                                        appointment
                                                    );

                                                return (
                                                    <tr
                                                        key={
                                                            appointment._id
                                                        }
                                                    >
                                                        <td>
                                                            <strong>
                                                                {
                                                                    appointment.patientName
                                                                }
                                                            </strong>
                                                        </td>

                                                        <td>
                                                            {formatDate(
                                                                appointment.scheduledAt
                                                            )}
                                                        </td>

                                                        <td>
                                                            {formatTime(
                                                                appointment.scheduledAt
                                                            )}
                                                        </td>

                                                        <td>
                                                            {appointment
                                                                .schedulingProviderId
                                                                ?.name ||
                                                                "-"}
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`status-badge status-${appointment.status.toLowerCase()}`}
                                                            >
                                                                {formatStatus(
                                                                    appointment.status
                                                                )}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <div className="appointment-actions">
                                                                {actions.map(
                                                                    (
                                                                        action
                                                                    ) => (
                                                                        <button
                                                                            key={
                                                                                action.status
                                                                            }
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleStatusChange(
                                                                                    appointment._id,
                                                                                    action.status
                                                                                )
                                                                            }
                                                                        >
                                                                            {
                                                                                action.label
                                                                            }
                                                                        </button>
                                                                    )
                                                                )}

                                                                {[
                                                                    "REQUESTED",
                                                                    "CONFIRMED",
                                                                ].includes(
                                                                    appointment.status
                                                                ) && (
                                                                    <button
                                                                        type="button"
                                                                        className="danger-button"
                                                                        onClick={() =>
                                                                            handleCancel(
                                                                                appointment._id
                                                                            )
                                                                        }
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pagination">
                                <button
                                    type="button"
                                    disabled={page === 1}
                                    onClick={() =>
                                        setPage(
                                            (previous) =>
                                                previous - 1
                                        )
                                    }
                                >
                                    Previous
                                </button>

                                <span>
                                    Page {page} of{" "}
                                    {pagination.totalPages}
                                </span>

                                <button
                                    type="button"
                                    disabled={
                                        page >=
                                        pagination.totalPages
                                    }
                                    onClick={() =>
                                        setPage(
                                            (previous) =>
                                                previous + 1
                                        )
                                    }
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    )}
            </div>
        </div>
    );
};

export default Appointments;