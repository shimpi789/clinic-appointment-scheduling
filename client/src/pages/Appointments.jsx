import { useCallback, useEffect, useState } from "react";
import {
    getAppointments,
    reassignSchedulingProvider,
    getVisitNotes,
    getAppointmentHistory,
    addVisitNote,
    updateVisitNote,
    updateAppointmentStatus,
    cancelAppointment,
    addSupportingProvider,
    removeSupportingProvider,
} from "../services/appointmentService";
import { getProviders } from "../services/authService";
import { useAuth } from "../context/useAuth";
import "../styles/appointments.css";

const Appointments = () => {
    const { user } = useAuth();

    const [appointments, setAppointments] = useState([]);
    const [providers, setProviders] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [page, setPage] = useState(1);

    const [pagination, setPagination] = useState({
        totalMatches: 0,
        totalPages: 1,
    });

    const [editingProviderId, setEditingProviderId] = useState(null);
    const [selectedProviderId, setSelectedProviderId] =
        useState("");

    const [selectedAppointment, setSelectedAppointment] =
        useState(null);

        const [notes, setNotes] = useState([]);
        const [notesLoading, setNotesLoading] = useState(false);
        
        const [history, setHistory] = useState([]);
        const [historyLoading, setHistoryLoading] = useState(false);



    const [noteText, setNoteText] = useState("");
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editingNoteText, setEditingNoteText] = useState("");

    const [selectedSupportingProvider, setSelectedSupportingProvider] =
        useState("");

    const [cancelAppointmentId, setCancelAppointmentId] =
        useState(null);
    const [cancelReason, setCancelReason] = useState("");

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

    useEffect(() => {
        const fetchProviders = async () => {
            if (user?.role !== "FRONT_DESK") {
                return;
            }

            try {
                const data = await getProviders();
                setProviders(data.providers || []);
            } catch (error) {
                setError(error.message);
            }
        };

        fetchProviders();
    }, [user]);

    const handleSearch = (event) => {
        event.preventDefault();
        setPage(1);
    };

    const handleClearFilters = () => {
        setSearch("");
        setStatus("");
        setFromDate("");
        setToDate("");
        setPage(1);
    };

    const handleStartReassign = (appointment) => {
        setError("");
        setSuccess("");

        setEditingProviderId(appointment._id);

        setSelectedProviderId(
            appointment.schedulingProviderId?._id || ""
        );
    };

    const handleCancelReassign = () => {
        setEditingProviderId(null);
        setSelectedProviderId("");
    };

    const handleReassign = async (appointmentId) => {
        if (!selectedProviderId) {
            setError("Please select a provider.");
            return;
        }

        try {
            setError("");
            setSuccess("");

            await reassignSchedulingProvider(
                appointmentId,
                selectedProviderId
            );

            setSuccess(
                "Scheduling provider reassigned successfully."
            );

            setEditingProviderId(null);
            setSelectedProviderId("");

            await fetchAppointments();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleStatusChange = async (appointmentId, nextStatus) => {
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

            if (selectedAppointment?._id === appointmentId) {
                const updatedAppointment = appointments.find(
                    (appointment) =>
                        appointment._id === appointmentId
                );

                if (updatedAppointment) {
                    setSelectedAppointment({
                        ...updatedAppointment,
                        status: nextStatus,
                    });
                }
            }
        } catch (error) {
            setError(error.message);
        }
    };

    const handleOpenCancel = (appointmentId) => {
        setError("");
        setSuccess("");
        setCancelAppointmentId(appointmentId);
        setCancelReason("");
    };

    const handleCloseCancel = () => {
        setCancelAppointmentId(null);
        setCancelReason("");
    };

    const handleCancelAppointment = async () => {
        if (!cancelReason.trim()) {
            setError("Cancellation reason is required.");
            return;
        }

        try {
            setError("");
            setSuccess("");

            await cancelAppointment(
                cancelAppointmentId,
                cancelReason.trim()
            );

            setSuccess(
                "Appointment cancelled successfully."
            );

            handleCloseCancel();

            await fetchAppointments();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleAddSupportingProvider = async () => {
        if (!selectedSupportingProvider) {
            setError("Please select a supporting provider.");
            return;
        }

        try {
            setError("");
            setSuccess("");

            await addSupportingProvider(
                selectedAppointment._id,
                selectedSupportingProvider
            );

            setSuccess(
                "Supporting provider added successfully."
            );

            setSelectedSupportingProvider("");

            await fetchAppointments();

            const data = await getAppointments({
                search,
                status,
                startDate: fromDate,
                endDate: toDate,
                page,
                limit: 10,
            });

            const updatedAppointment =
                data.appointments?.find(
                    (appointment) =>
                        appointment._id ===
                        selectedAppointment._id
                );

            if (updatedAppointment) {
                setSelectedAppointment(updatedAppointment);
            }
        } catch (error) {
            setError(error.message);
        }
    };

    const handleRemoveSupportingProvider = async (
        providerId
    ) => {
        try {
            setError("");
            setSuccess("");

            await removeSupportingProvider(
                selectedAppointment._id,
                providerId
            );

            setSuccess(
                "Supporting provider removed successfully."
            );

            await fetchAppointments();

            const data = await getAppointments({
                search,
                status,
                startDate: fromDate,
                endDate: toDate,
                page,
                limit: 10,
            });

            const updatedAppointment =
                data.appointments?.find(
                    (appointment) =>
                        appointment._id ===
                        selectedAppointment._id
                );

            if (updatedAppointment) {
                setSelectedAppointment(updatedAppointment);
            }
        } catch (error) {
            setError(error.message);
        }
    };

    const handleOpenDetails = async (appointment) => {
        try {
            setError("");
            setSuccess("");
            setSelectedAppointment(appointment);

            setNotes([]);
            setHistory([]);
            setNoteText("");
            setEditingNoteId(null);
            setEditingNoteText("");
            setSelectedSupportingProvider("");

            setNotesLoading(true);
            setHistoryLoading(true);

            const [notesData, historyData] = await Promise.all([
                getVisitNotes(appointment._id),
                getAppointmentHistory(appointment._id),
            ]);

            setNotes(notesData.notes || []);
            setHistory(historyData.history || []);
        } catch (error) {
            setError(error.message);
        } finally {
            setNotesLoading(false);
            setHistoryLoading(false);
        }
    };

    const handleCloseDetails = () => {
        setSelectedAppointment(null);
        setNotes([]);
        setHistory([]);
        setNoteText("");
        setEditingNoteId(null);
        setEditingNoteText("");
        setSelectedSupportingProvider("");
    };

    const handleAddNote = async () => {
        if (!noteText.trim()) {
            setError("Please enter a visit note.");
            return;
        }

        try {
            setError("");
            setSuccess("");

            await addVisitNote(
                selectedAppointment._id,
                noteText.trim()
            );

            setNoteText("");

            const [notesData, historyData] = await Promise.all([
                getVisitNotes(selectedAppointment._id),
                getAppointmentHistory(selectedAppointment._id),
            ]);

            setNotes(notesData.notes || []);
            setHistory(historyData.history || []);

            setSuccess("Visit note added successfully.");
        } catch (error) {
            setError(error.message);
        }
    };

    const handleStartEditNote = (note) => {
        setError("");
        setSuccess("");

        setEditingNoteId(note._id);
        setEditingNoteText(note.text);
    };

    const handleCancelEditNote = () => {
        setEditingNoteId(null);
        setEditingNoteText("");
    };

    const handleUpdateNote = async (noteId) => {
        if (!editingNoteText.trim()) {
            setError("Note text cannot be empty.");
            return;
        }

        try {
            setError("");
            setSuccess("");

            await updateVisitNote(
                noteId,
                editingNoteText.trim()
            );

            const data = await getVisitNotes(
                selectedAppointment._id
            );

            setNotes(data.notes || []);

            setEditingNoteId(null);
            setEditingNoteText("");

            setSuccess("Visit note updated successfully.");
        } catch (error) {
            setError(error.message);
        }
    };

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatStatus = (value) => {
        if (!value) return "-";

        return value
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    const isCurrentUserNoteAuthor = (note) => {
        return (
            user?.role === "PROVIDER" &&
            note.providerId?._id === user.userId
        );
    };

    const getHistoryDescription = (item) => {
        switch (item.type) {
            case "STATUS_CHANGE":
                return `Status changed from ${formatStatus(
                    item.oldStatus
                )} to ${formatStatus(item.newStatus)}.`;

            case "SUPPORTING_PROVIDER_ADDED":
                return `Supporting provider ${
                    item.providerId?.name || "provider"
                } was added.`;

            case "SUPPORTING_PROVIDER_REMOVED":
                return `Supporting provider ${
                    item.providerId?.name || "provider"
                } was removed.`;

            case "SCHEDULING_PROVIDER_REASSIGNED":
                return `Scheduling provider changed to ${
                    item.providerId?.name || "provider"
                }.`;

            case "CANCELLATION":
                return `Appointment cancelled${
                    item.reason ? `: ${item.reason}` : "."
                }`;

            case "VISIT_NOTE_ADDED":
                return "A visit note was added.";

            default:
                return "Appointment history updated.";
        }
    };

    const getStatusActions = (appointment) => {
        const actions = [];

        if (appointment.status === "REQUESTED") {
            actions.push({
                label: "Confirm",
                status: "CONFIRMED",
            });
        }

        if (appointment.status === "CONFIRMED") {
            actions.push({
                label: "Check In",
                status: "CHECKED_IN",
            });

            if (
                appointment.scheduledAt &&
                new Date() >= new Date(appointment.scheduledAt)
            ) {
                actions.push({
                    label: "No Show",
                    status: "NO_SHOW",
                });
            }
        }

        if (appointment.status === "CHECKED_IN") {
            actions.push({
                label: "Complete",
                status: "COMPLETED",
            });
        }

        return actions;
    };

    return (
        <div className="appointments-page">
            <div className="page-header">
                <div>
                    <h2>Appointments</h2>
                    <p>
                        Manage and view clinic appointments
                        {user?.role === "PROVIDER" &&
                            " assigned to you"}.
                    </p>
                </div>
            </div>

            <div className="filters-card">
                <form onSubmit={handleSearch}>
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
                                    setSearch(event.target.value)
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
                                onClick={handleClearFilters}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {success && (
                <div className="success-message">
                    {success}
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

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
                    !error &&
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
                                                Scheduling Provider
                                            </th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                            {user?.role ===
                                                "FRONT_DESK" && (
                                                <th>
                                                    Reassign
                                                </th>
                                            )}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {appointments.map(
                                            (appointment) => (
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
                                                        {editingProviderId ===
                                                        appointment._id ? (
                                                            <select
                                                                className="reassign-select"
                                                                value={
                                                                    selectedProviderId
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setSelectedProviderId(
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                            >
                                                                <option value="">
                                                                    Select provider
                                                                </option>

                                                                {providers.map(
                                                                    (
                                                                        provider
                                                                    ) => (
                                                                        <option
                                                                            key={
                                                                                provider._id
                                                                            }
                                                                            value={
                                                                                provider._id
                                                                            }
                                                                        >
                                                                            {
                                                                                provider.name
                                                                            }
                                                                        </option>
                                                                    )
                                                                )}
                                                            </select>
                                                        ) : (
                                                            appointment
                                                                .schedulingProviderId
                                                                ?.name ||
                                                            "-"
                                                        )}
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
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleOpenDetails(
                                                                        appointment
                                                                    )
                                                                }
                                                            >
                                                                Details
                                                            </button>

                                                            {getStatusActions(
                                                                appointment
                                                            ).map(
                                                                (
                                                                    action
                                                                ) => (
                                                                    <button
                                                                        type="button"
                                                                        key={
                                                                            action.status
                                                                        }
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

                                                            {![
                                                                "CHECKED_IN",
                                                                "COMPLETED",
                                                                "NO_SHOW",
                                                                "CANCELLED",
                                                            ].includes(
                                                                appointment.status
                                                            ) && (
                                                                <button
                                                                    type="button"
                                                                    className="danger-button"
                                                                    onClick={() =>
                                                                        handleOpenCancel(
                                                                            appointment._id
                                                                        )
                                                                    }
                                                                >
                                                                    Cancel
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {user?.role ===
                                                        "FRONT_DESK" && (
                                                        <td>
                                                            {editingProviderId ===
                                                            appointment._id ? (
                                                                <div className="action-buttons">
                                                                    <button
                                                                        type="button"
                                                                        className="small-button"
                                                                        onClick={() =>
                                                                            handleReassign(
                                                                                appointment._id
                                                                            )
                                                                        }
                                                                    >
                                                                        Save
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="small-button secondary-button"
                                                                        onClick={
                                                                            handleCancelReassign
                                                                        }
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    className="small-button"
                                                                    onClick={() =>
                                                                        handleStartReassign(
                                                                            appointment
                                                                        )
                                                                    }
                                                                >
                                                                    Reassign
                                                                </button>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            )
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

            {selectedAppointment && (
                <div className="details-panel">
                    <div className="details-header">
                        <div>
                            <h3>
                                Appointment Details
                            </h3>
                            <p>
                                {
                                    selectedAppointment.patientName
                                }
                            </p>
                        </div>

                        <button
                            type="button"
                            className="small-button secondary-button"
                            onClick={handleCloseDetails}
                        >
                            Close
                        </button>
                    </div>

                    <div className="appointment-details-grid">
                        <div>
                            <strong>Date</strong>
                            <span>
                                {formatDate(
                                    selectedAppointment.scheduledAt
                                )}
                            </span>
                        </div>

                        <div>
                            <strong>Time</strong>
                            <span>
                                {formatTime(
                                    selectedAppointment.scheduledAt
                                )}
                            </span>
                        </div>

                        <div>
                            <strong>Status</strong>
                            <span>
                                {formatStatus(
                                    selectedAppointment.status
                                )}
                            </span>
                        </div>

                        <div>
                            <strong>Scheduling Provider</strong>
                            <span>
                                {
                                    selectedAppointment
                                        .schedulingProviderId?.name
                                }
                            </span>
                        </div>
                    </div>

                    <div className="care-team-section">
                        <h4>Care Team</h4>

                        <p>
                            <strong>
                                Scheduling Provider:
                            </strong>{" "}
                            {selectedAppointment
                                .schedulingProviderId?.name ||
                                "-"}
                        </p>

                        <p>
                            <strong>
                                Supporting Providers:
                            </strong>
                        </p>

                        {selectedAppointment
                            .supportingProviderIds?.length >
                        0 ? (
                            <div className="supporting-provider-list">
                                {selectedAppointment.supportingProviderIds.map(
                                    (provider) => (
                                        <div
                                            className="supporting-provider-item"
                                            key={provider._id}
                                        >
                                            <span>
                                                {
                                                    provider.name
                                                }
                                            </span>

                                            {user?.role ===
                                                "FRONT_DESK" && (
                                                <button
                                                    type="button"
                                                    className="small-button secondary-button"
                                                    onClick={() =>
                                                        handleRemoveSupportingProvider(
                                                            provider._id
                                                        )
                                                    }
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <p>None</p>
                        )}

                        {user?.role === "FRONT_DESK" && (
                            <div className="supporting-provider-form">
                                <select
                                    value={
                                        selectedSupportingProvider
                                    }
                                    onChange={(event) =>
                                        setSelectedSupportingProvider(
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        Select supporting provider
                                    </option>

                                    {providers
                                        .filter(
                                            (provider) =>
                                                provider._id !==
                                                selectedAppointment
                                                    .schedulingProviderId
                                                    ?._id &&
                                                !selectedAppointment.supportingProviderIds?.some(
                                                    (supporting) =>
                                                        supporting._id ===
                                                        provider._id
                                                )
                                        )
                                        .map((provider) => (
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
                                        ))}
                                </select>

                                <button
                                    type="button"
                                    className="small-button"
                                    onClick={
                                        handleAddSupportingProvider
                                    }
                                >
                                    Add Supporting Provider
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="history-section">
                        <div className="notes-header">
                            <div>
                                <h4>Appointment Timeline</h4>
                                <p>
                                    All appointment changes are shown in
                                    chronological order.
                                </p>
                            </div>
                        </div>

                        {historyLoading && (
                            <div className="state-message">
                                Loading appointment history...
                            </div>
                        )}

                        {!historyLoading && history.length === 0 && (
                            <div className="state-message">
                                No history recorded yet.
                            </div>
                        )}

                        {!historyLoading && history.length > 0 && (
                            <div className="history-list">
                                {history.map((item) => (
                                    <div
                                        className="history-card"
                                        key={item._id}
                                    >
                                        <div className="history-meta">
                                            <strong>
                                                {getHistoryDescription(item)}
                                            </strong>

                                            <span>
                                                {new Date(
                                                    item.createdAt
                                                ).toLocaleString("en-IN")}
                                            </span>
                                        </div>

                                        <p className="history-performed-by">
                                            By{" "}
                                            {item.performedBy?.name ||
                                                "Unknown user"}
                                            {item.performedBy?.role
                                                ? ` (${formatStatus(
                                                      item.performedBy.role
                                                  )})`
                                                : ""}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="visit-notes-section">
                        <div className="notes-header">
                            <div>
                                <h4>Visit Notes</h4>
                                <p>
                                    Notes are shown in
                                    chronological order.
                                </p>
                            </div>
                        </div>

                        {notesLoading && (
                            <div className="state-message">
                                Loading visit notes...
                            </div>
                        )}

                        {!notesLoading &&
                            notes.length === 0 && (
                                <div className="state-message">
                                    No visit notes yet.
                                </div>
                            )}

                        {!notesLoading &&
                            notes.length > 0 && (
                                <div className="notes-list">
                                    {notes.map((note) => (
                                        <div
                                            className="note-card"
                                            key={note._id}
                                        >
                                            <div className="note-meta">
                                                <strong>
                                                    {note
                                                        .providerId
                                                        ?.name ||
                                                        "Provider"}
                                                </strong>

                                                <span>
                                                    {new Date(
                                                        note.createdAt
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </span>
                                            </div>

                                            {editingNoteId ===
                                            note._id ? (
                                                <div className="note-edit">
                                                    <textarea
                                                        value={
                                                            editingNoteText
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setEditingNoteText(
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        rows="4"
                                                    />

                                                    <div className="action-buttons">
                                                        <button
                                                            type="button"
                                                            className="small-button"
                                                            onClick={() =>
                                                                handleUpdateNote(
                                                                    note._id
                                                                )
                                                            }
                                                        >
                                                            Save
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="small-button secondary-button"
                                                            onClick={
                                                                handleCancelEditNote
                                                            }
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="note-text">
                                                        {note.text}
                                                    </p>

                                                    {isCurrentUserNoteAuthor(
                                                        note
                                                    ) && (
                                                        <button
                                                            type="button"
                                                            className="small-button"
                                                            onClick={() =>
                                                                handleStartEditNote(
                                                                    note
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                        {user?.role === "PROVIDER" && (
                            <div className="add-note-form">
                                <label htmlFor="noteText">
                                    Add Visit Note
                                </label>

                                <textarea
                                    id="noteText"
                                    value={noteText}
                                    onChange={(event) =>
                                        setNoteText(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter provider observations..."
                                    rows="4"
                                />

                                <button
                                    type="button"
                                    onClick={handleAddNote}
                                >
                                    Add Note
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {cancelAppointmentId && (
                <div className="cancel-modal-overlay">
                    <div className="cancel-modal">
                        <h3>Cancel Appointment</h3>

                        <p>
                            Please provide a reason for
                            cancelling this appointment.
                        </p>

                        <label htmlFor="cancelReason">
                            Cancellation Reason
                        </label>

                        <textarea
                            id="cancelReason"
                            value={cancelReason}
                            onChange={(event) =>
                                setCancelReason(
                                    event.target.value
                                )
                            }
                            placeholder="Enter cancellation reason..."
                            rows="4"
                        />

                        <div className="action-buttons">
                            <button
                                type="button"
                                className="small-button danger-button"
                                onClick={
                                    handleCancelAppointment
                                }
                            >
                                Confirm Cancellation
                            </button>

                            <button
                                type="button"
                                className="small-button secondary-button"
                                onClick={handleCloseCancel}
                            >
                                Keep Appointment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Appointments;