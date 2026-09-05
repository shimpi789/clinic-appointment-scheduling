import { useCallback, useEffect, useState } from "react";
import { createSlot, getSlots } from "../services/slotService";
import { getProviders } from "../services/authService";
import { useAuth } from "../context/useAuth";
import "../styles/availability.css";

const Availability = () => {
    const { user } = useAuth();

    const [slots, setSlots] = useState([]);
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        providerId: "",
        date: "",
        startTime: "",
        duration: 30,
    });

    const loadSlots = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            let data;

            if (user?.role === "FRONT_DESK") {
                if (!formData.providerId) {
                    setSlots([]);
                    setLoading(false);
                    return;
                }

                data = await getSlots({
                    providerId: formData.providerId,
                });
            } else {
                data = await getSlots();
            }

            setSlots(data.slots || []);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [user, formData.providerId]);

    const loadProviders = useCallback(async () => {
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
        // Loading availability from the API is intentional here.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadSlots();
    }, [loadSlots]);

    useEffect(() => {
        // Loading providers from the API is intentional here.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadProviders();
    }, [loadProviders]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setError("");
            setSuccess("");

            const data = {
                providerId:
                    user?.role === "FRONT_DESK"
                        ? formData.providerId
                        : user?.id,
                date: formData.date,
                startTime: formData.startTime,
                duration: Number(formData.duration),
            };

            await createSlot(data);

            setSuccess("Availability created successfully.");

            setFormData({
                providerId: "",
                date: "",
                startTime: "",
                duration: 30,
            });

            await loadSlots();
        } catch (error) {
            setError(error.message);
        }
    };

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(`${date}T00:00:00`).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    return (
        <div className="availability-page">
            <div className="availability-header">
                <div>
                    <h2>Availability</h2>

                    <p>
                        Create and manage appointment availability.
                    </p>
                </div>
            </div>

            <div className="availability-form-card">
                <div className="card-header">
                    <h3>Create Availability</h3>

                    <span>
                        {user?.role === "FRONT_DESK"
                            ? "Create a slot for any provider."
                            : "Create availability for your schedule."}
                    </span>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="availability-form-grid">
                        {user?.role === "FRONT_DESK" && (
                            <div className="availability-field">
                                <label htmlFor="providerId">
                                    Provider
                                </label>

                                <select
                                    id="providerId"
                                    name="providerId"
                                    value={formData.providerId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">
                                        Select a provider
                                    </option>

                                    {providers.map((provider) => (
                                        <option
                                            key={provider._id}
                                            value={provider._id}
                                        >
                                            {provider.name} ({provider.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="availability-field">
                            <label htmlFor="date">
                                Date
                            </label>

                            <input
                                id="date"
                                name="date"
                                type="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="availability-field">
                            <label htmlFor="startTime">
                                Start Time
                            </label>

                            <input
                                id="startTime"
                                name="startTime"
                                type="time"
                                value={formData.startTime}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="availability-field">
                            <label htmlFor="duration">
                                Duration (minutes)
                            </label>

                            <input
                                id="duration"
                                name="duration"
                                type="number"
                                min="1"
                                value={formData.duration}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="availability-actions">
                            <button type="submit">
                                Create Slot
                            </button>
                        </div>
                    </div>
                </form>

                {error && (
                    <div className="availability-error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="availability-success">
                        {success}
                    </div>
                )}
            </div>

            <div className="availability-list-card">
                <div className="card-header">
                    <div>
                        <h3>Availability Slots</h3>

                        <span>
                            {slots.length} slots loaded
                        </span>
                    </div>
                </div>

                {loading && (
                    <div className="availability-state">
                        Loading availability...
                    </div>
                )}

                {!loading && !error && slots.length === 0 && (
                    <div className="availability-state">
                        {user?.role === "FRONT_DESK"
                            ? "Select a provider to view availability."
                            : "No availability slots found."}
                    </div>
                )}

                {!loading && slots.length > 0 && (
                    <div className="availability-table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Start Time</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {slots.map((slot) => (
                                    <tr key={slot._id}>
                                        <td>
                                            {formatDate(slot.date)}
                                        </td>

                                        <td>
                                            {slot.startTime}
                                        </td>

                                        <td>
                                            {slot.duration} min
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    slot.archived
                                                        ? "slot-status archived"
                                                        : "slot-status active"
                                                }
                                            >
                                                {slot.archived
                                                    ? "Archived"
                                                    : "Active"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Availability;