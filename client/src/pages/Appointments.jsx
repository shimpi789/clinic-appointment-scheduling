import { useEffect, useState } from "react";
import { getAppointments } from "../services/appointmentService";
import { useAuth } from "../context/useAuth";
import "../styles/appointments.css";

const Appointments = () => {
    const { user } = useAuth();

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        totalMatches: 0,
        totalPages: 1,
    });

    useEffect(() => {
        const loadAppointments = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await getAppointments({
                    search,
                    status,
                    fromDate,
                    toDate,
                    page,
                    limit: 10,
                });

                setAppointments(data.appointments || []);

                setPagination({
                    totalMatches: data.totalMatches || 0,
                    totalPages: data.totalPages || 1,
                });
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        loadAppointments();
    }, [search, status, fromDate, toDate, page]);

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

    return (
        <div className="appointments-page">
            <div className="page-header">
                <div>
                    <h2>Appointments</h2>

                    <p>
                        Manage and view clinic appointments
                        {user?.role === "PROVIDER" && " assigned to you"}.
                    </p>
                </div>
            </div>

            <div className="filters-card">
                <form onSubmit={handleSearch}>
                    <div className="filter-row">
                        <div className="filter-group search-group">
                            <label htmlFor="search">Patient</label>

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
                            <label htmlFor="status">Status</label>

                            <select
                                id="status"
                                value={status}
                                onChange={(event) => {
                                    setStatus(event.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">All statuses</option>
                                <option value="REQUESTED">Requested</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="CHECKED_IN">
                                    Checked In
                                </option>
                                <option value="COMPLETED">Completed</option>
                                <option value="NO_SHOW">No Show</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="fromDate">From</label>

                            <input
                                id="fromDate"
                                type="date"
                                value={fromDate}
                                onChange={(event) => {
                                    setFromDate(event.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>

                        <div className="filter-group">
                            <label htmlFor="toDate">To</label>

                            <input
                                id="toDate"
                                type="date"
                                value={toDate}
                                onChange={(event) => {
                                    setToDate(event.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>

                        <div className="filter-actions">
                            <button type="submit">Search</button>

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

            <div className="appointments-card">
                <div className="card-header">
                    <div>
                        <h3>Appointment List</h3>

                        <span>
                            {pagination.totalMatches} total matches
                        </span>
                    </div>
                </div>

                {loading && (
                    <div className="state-message">
                        Loading appointments...
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {!loading && !error && appointments.length === 0 && (
                    <div className="state-message">
                        No appointments found.
                    </div>
                )}

                {!loading && !error && appointments.length > 0 && (
                    <>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Scheduling Provider</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {appointments.map((appointment) => (
                                        <tr key={appointment._id}>
                                            <td>
                                                <strong>
                                                    {appointment.patientName}
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
                                                {appointment.schedulingProviderId
                                                    ?.name || "-"}
                                            </td>

                                            <td>
                                                <span
                                                    className={`status-badge status-${appointment.status.toLowerCase()}`}
                                                >
                                                    {appointment.status.replace(
                                                        "_",
                                                        " "
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="pagination">
                            <button
                                type="button"
                                disabled={page === 1}
                                onClick={() => setPage((prev) => prev - 1)}
                            >
                                Previous
                            </button>

                            <span>
                                Page {page} of {pagination.totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage((prev) => prev + 1)}
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