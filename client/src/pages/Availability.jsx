import { useCallback, useEffect, useState } from "react";
import {
    createSlot,
    getSlots,
    updateSlot,
    archiveSlot,
    restoreSlot,
} from "../services/slotService";
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

    const [showArchived, setShowArchived] = useState(false);
    const [editingSlotId, setEditingSlotId] = useState(null);

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
                    archived: showArchived,
                });
            } else {
                data = await getSlots({
                    archived: showArchived,
                });
            }

            setSlots(data.slots || []);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [user, formData.providerId, showArchived]);

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

    const resetForm = (preserveProvider = false) => {
        setEditingSlotId(null);

        setFormData((previous) => ({
            providerId: preserveProvider
                ? previous.providerId
                : "",
            date: "",
            startTime: "",
            duration: 30,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setError("");
            setSuccess("");

            const data = {
                date: formData.date,
                startTime: formData.startTime,
                duration: Number(formData.duration),
            };

            if (user?.role === "FRONT_DESK") {
                data.providerId = formData.providerId;
            } else {
                data.providerId = user?.id;
            }

            if (editingSlotId) {
                await updateSlot(editingSlotId, data);

                setSuccess(
                    "Availability updated successfully."
                );

                resetForm(
                    user?.role === "FRONT_DESK"
                );
            } else {
                await createSlot(data);

                setSuccess(
                    "Availability created successfully."
                );

                resetForm(
                    user?.role === "FRONT_DESK"
                );
            }

            await loadSlots();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleEdit = (slot) => {
        setError("");
        setSuccess("");

        setEditingSlotId(slot._id);

        setFormData({
            providerId:
                slot.providerId?._id ||
                slot.providerId ||
                "",
            date: slot.date || "",
            startTime: slot.startTime || "",
            duration: slot.duration || 30,
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleArchive = async (slotId) => {
        try {
            setError("");
            setSuccess("");

            await archiveSlot(slotId);

            setSuccess(
                "Availability archived successfully."
            );

            await loadSlots();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleRestore = async (slotId) => {
        try {
            setError("");
            setSuccess("");

            await restoreSlot(slotId);

            setSuccess(
                "Availability restored successfully."
            );

            await loadSlots();
        } catch (error) {
            setError(error.message);
        }
    };

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(
            `${date}T00:00:00`
        ).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
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

            {/* Create / Edit Availability */}

            <div className="availability-form-card">
                <div className="card-header">
                    <div>
                        <h3>
                            {editingSlotId
                                ? "Edit Availability"
                                : "Create Availability"}
                        </h3>

                        <span>
                            {user?.role === "FRONT_DESK"
                                ? "Create and manage slots for providers."
                                : "Create and manage your schedule."}
                        </span>
                    </div>
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
                                    disabled={Boolean(
                                        editingSlotId
                                    )}
                                >
                                    <option value="">
                                        Select a provider
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
                                                {provider.name} (
                                                {provider.email})
                                            </option>
                                        )
                                    )}
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
                            <button
                                type="submit"
                                className="primary-button"
                            >
                                {editingSlotId
                                    ? "Update Slot"
                                    : "Create Slot"}
                            </button>

                            {editingSlotId && (
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                        resetForm(
                                            user?.role ===
                                                "FRONT_DESK"
                                        )
                                    }
                                >
                                    Cancel Edit
                                </button>
                            )}
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

            {/* Availability List */}

            <div className="availability-list-card">
                <div className="card-header availability-list-header">
                    <div>
                        <h3>Availability Slots</h3>

                        <span>
                            {slots.length}{" "}
                            {showArchived
                                ? "archived"
                                : "active"}{" "}
                            slots loaded
                        </span>
                    </div>

                    <label className="archived-toggle">
                        <input
                            type="checkbox"
                            checked={showArchived}
                            onChange={(event) =>
                                setShowArchived(
                                    event.target.checked
                                )
                            }
                        />

                        <span>Show Archived</span>
                    </label>
                </div>

                {loading && (
                    <div className="availability-state">
                        Loading availability...
                    </div>
                )}

                {!loading &&
                    !error &&
                    slots.length === 0 && (
                        <div className="availability-state">
                            {showArchived
                                ? "No archived availability slots found."
                                : user?.role === "FRONT_DESK"
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
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {slots.map((slot) => (
                                    <tr key={slot._id}>
                                        <td>
                                            {formatDate(
                                                slot.date
                                            )}
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

                                        <td>
                                            <div className="availability-row-actions">
                                                {slot.archived ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRestore(
                                                                slot._id
                                                            )
                                                        }
                                                    >
                                                        Restore
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    slot
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleArchive(
                                                                    slot._id
                                                                )
                                                            }
                                                        >
                                                            Archive
                                                        </button>
                                                    </>
                                                )}
                                            </div>
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