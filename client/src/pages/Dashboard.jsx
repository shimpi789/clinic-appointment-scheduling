import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getDashboard } from "../services/dashboardService";
import {
    getAlerts,
    dismissAlert,
} from "../services/alertService";
import "../styles/dashboard.css";

const Dashboard = () => {
    const { user, logout } = useAuth();

    const [dashboard, setDashboard] = useState(null);
    const [alerts, setAlerts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const [dashboardData, alertData] =
                await Promise.all([
                    getDashboard(),
                    getAlerts(),
                ]);

            setDashboard(dashboardData);
            setAlerts(alertData.alerts || []);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Dashboard data is intentionally loaded when the page opens.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadDashboard();
    }, [loadDashboard]);

    const handleDismissAlert = async (appointmentId) => {
        try {
            setError("");

            await dismissAlert(appointmentId);

            setAlerts((previous) =>
                previous.filter(
                    (alert) => alert._id !== appointmentId
                )
            );
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

    const formatStatus = (status) => {
        if (!status) return "-";

        return status
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    if (loading) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-state">
                    Loading dashboard...
                </div>
            </div>
        );
    }

    if (error && !dashboard) {
        return (
            <div className="dashboard-page">
                <div className="error-message">
                    {error}
                </div>
            </div>
        );
    }

    const summary = dashboard?.summary || {};

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <div>
                    <h1>Clinic Appointment Scheduling</h1>
                    <p>
                        Welcome, {user?.name}
                    </p>
                </div>

                <div className="dashboard-header-actions">
                    <Link to="/appointments">
                        Appointments
                    </Link>

                    <Link to="/availability">
                        Availability
                    </Link>

                    <button
                        type="button"
                        onClick={logout}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-title">
                    <div>
                        <h2>Dashboard</h2>
                        <p>
                            Overview of clinic scheduling
                            activity.
                        </p>
                    </div>

                    <span className="role-badge">
                        {user?.role === "FRONT_DESK"
                            ? "Front Desk"
                            : "Provider"}
                    </span>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Alert Section */}

                {alerts.length > 0 && (
                    <section className="dashboard-section alert-section">
                        <div className="section-header">
                            <div>
                                <h3>
                                    Pending Appointment
                                    Alerts
                                </h3>
                                <p>
                                    Requested appointments
                                    requiring attention.
                                </p>
                            </div>

                            {user?.role === "FRONT_DESK" && (
                                <span className="alert-count">
                                    {alerts.length}
                                </span>
                            )}
                        </div>

                        <div className="alert-list">
                            {alerts.map((alert) => (
                                <div
                                    className="alert-item"
                                    key={alert._id}
                                >
                                    <div>
                                        <strong>
                                            {alert.patientName}
                                        </strong>

                                        <span>
                                            {formatDate(
                                                alert.scheduledAt
                                            )}{" "}
                                            at{" "}
                                            {formatTime(
                                                alert.scheduledAt
                                            )}
                                        </span>

                                        <span>
                                            Provider:{" "}
                                            {alert
                                                .schedulingProviderId
                                                ?.name || "-"}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleDismissAlert(
                                                alert._id
                                            )
                                        }
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Summary */}

                <section className="summary-grid">
                    <div className="summary-card">
                        <span>
                            Today's Appointments
                        </span>
                        <strong>
                            {summary.todayAppointments || 0}
                        </strong>
                    </div>

                    <div className="summary-card">
                        <span>Currently Checked In</span>
                        <strong>
                            {summary.currentlyCheckedIn || 0}
                        </strong>
                    </div>

                    <div className="summary-card">
                        <span>No-Shows This Week</span>
                        <strong>
                            {summary.noShowsThisWeek || 0}
                        </strong>
                    </div>

                    <div className="summary-card">
                        <span>Upcoming Confirmed</span>
                        <strong>
                            {summary.upcomingConfirmed || 0}
                        </strong>
                    </div>
                </section>

                {/* Today's Appointments */}

                <section className="dashboard-section">
                    <div className="section-header">
                        <div>
                            <h3>
                                Today's Appointments
                            </h3>
                            <p>
                                Scheduled appointments for
                                today.
                            </p>
                        </div>
                    </div>

                    {dashboard?.todayAppointments?.length >
                    0 ? (
                        <div className="dashboard-table-wrapper">
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Time</th>
                                        <th>Provider</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {dashboard.todayAppointments.map(
                                        (appointment) => (
                                            <tr
                                                key={
                                                    appointment._id
                                                }
                                            >
                                                <td>
                                                    {
                                                        appointment.patientName
                                                    }
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
                                                    <span className="dashboard-status">
                                                        {formatStatus(
                                                            appointment.status
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-dashboard">
                            No appointments scheduled for
                            today.
                        </div>
                    )}
                </section>

                {/* Checked In + Upcoming */}

                <div className="dashboard-two-column">
                    <section className="dashboard-section">
                        <div className="section-header">
                            <div>
                                <h3>
                                    Currently Checked In
                                </h3>
                            </div>
                        </div>

                        {dashboard
                            ?.currentlyCheckedIn?.length >
                        0 ? (
                            <div className="compact-list">
                                {dashboard.currentlyCheckedIn.map(
                                    (appointment) => (
                                        <div
                                            className="compact-item"
                                            key={
                                                appointment._id
                                            }
                                        >
                                            <div>
                                                <strong>
                                                    {
                                                        appointment.patientName
                                                    }
                                                </strong>

                                                <span>
                                                    {formatTime(
                                                        appointment.scheduledAt
                                                    )}
                                                </span>
                                            </div>

                                            <span className="dashboard-status">
                                                Checked In
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="empty-dashboard">
                                No patients are currently
                                checked in.
                            </div>
                        )}
                    </section>

                    <section className="dashboard-section">
                        <div className="section-header">
                            <div>
                                <h3>
                                    Upcoming Confirmed
                                </h3>
                            </div>
                        </div>

                        {dashboard
                            ?.upcomingConfirmed?.length >
                        0 ? (
                            <div className="compact-list">
                                {dashboard.upcomingConfirmed.map(
                                    (appointment) => (
                                        <div
                                            className="compact-item"
                                            key={
                                                appointment._id
                                            }
                                        >
                                            <div>
                                                <strong>
                                                    {
                                                        appointment.patientName
                                                    }
                                                </strong>

                                                <span>
                                                    {formatDate(
                                                        appointment.scheduledAt
                                                    )}{" "}
                                                    •{" "}
                                                    {formatTime(
                                                        appointment.scheduledAt
                                                    )}
                                                </span>
                                            </div>

                                            <span className="dashboard-status">
                                                Confirmed
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="empty-dashboard">
                                No upcoming confirmed
                                appointments.
                            </div>
                        )}
                    </section>
                </div>

                {/* Provider + Status Breakdown */}

                <div className="dashboard-two-column">
                    <section className="dashboard-section">
                        <div className="section-header">
                            <div>
                                <h3>
                                    Provider Breakdown
                                </h3>
                                <p>
                                    Appointment distribution
                                    by scheduling provider.
                                </p>
                            </div>
                        </div>

                        {dashboard
                            ?.providerBreakdown?.length >
                        0 ? (
                            <div className="dashboard-table-wrapper">
                                <table className="dashboard-table">
                                    <thead>
                                        <tr>
                                            <th>Provider</th>
                                            <th>Total</th>
                                            <th>Requested</th>
                                            <th>Confirmed</th>
                                            <th>Completed</th>
                                            <th>No Show</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {dashboard.providerBreakdown.map(
                                            (provider) => (
                                                <tr
                                                    key={
                                                        provider.providerId
                                                    }
                                                >
                                                    <td>
                                                        {
                                                            provider.providerName
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            provider.total
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            provider.requested
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            provider.confirmed
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            provider.completed
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            provider.noShow
                                                        }
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-dashboard">
                                No provider data available.
                            </div>
                        )}
                    </section>

                    <section className="dashboard-section">
                        <div className="section-header">
                            <div>
                                <h3>
                                    Status Breakdown
                                </h3>
                            </div>
                        </div>

                        {dashboard?.statusBreakdown?.length >
                        0 ? (
                            <div className="status-breakdown">
                                {dashboard.statusBreakdown.map(
                                    (item) => (
                                        <div
                                            className="status-row"
                                            key={item.status}
                                        >
                                            <span>
                                                {formatStatus(
                                                    item.status
                                                )}
                                            </span>

                                            <strong>
                                                {item.count}
                                            </strong>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="empty-dashboard">
                                No status data available.
                            </div>
                        )}
                    </section>
                </div>

                {/* 8 Week No Show Rate */}

                <section className="dashboard-section">
                    <div className="section-header">
                        <div>
                            <h3>
                                Weekly No-Show Rate
                            </h3>
                            <p>
                                No-show rate for the last 8
                                weeks.
                            </p>
                        </div>
                    </div>

                    <div className="weekly-rate-list">
                        {dashboard?.weeklyNoShowRate?.map(
                            (week) => (
                                <div
                                    className="weekly-rate-row"
                                    key={week.weekStart}
                                >
                                    <div className="week-label">
                                        <strong>
                                            {formatDate(
                                                week.weekStart
                                            )}
                                        </strong>

                                        <span>
                                            {week.totalAppointments}{" "}
                                            appointments
                                        </span>
                                    </div>

                                    <div className="rate-bar-container">
                                        <div
                                            className="rate-bar"
                                            style={{
                                                width: `${Math.min(
                                                    week.noShowRate,
                                                    100
                                                )}%`,
                                            }}
                                        />
                                    </div>

                                    <div className="rate-value">
                                        {
                                            week.noShowRate
                                        }
                                        %
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;