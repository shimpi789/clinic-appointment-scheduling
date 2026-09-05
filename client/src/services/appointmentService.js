import { api } from "./api";

export const getAppointments = async (params = {}) => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            queryParams.append(key, value);
        }
    });

    const queryString = queryParams.toString();

    return api.get(
        `/appointments${queryString ? `?${queryString}` : ""}`
    );
};

export const createAppointment = async (appointmentData) => {
    return api.post("/appointments", appointmentData);
};

export const updateAppointmentStatus = async (
    appointmentId,
    status
) => {
    return api.patch(
        `/appointments/${appointmentId}/status`,
        { status }
    );
};

export const cancelAppointment = async (
    appointmentId,
    reason
) => {
    return api.patch(
        `/appointments/${appointmentId}/cancel`,
        { reason }
    );
};

export const addSupportingProvider = async (
    appointmentId,
    providerId
) => {
    return api.patch(
        `/appointments/${appointmentId}/supporting-providers`,
        { providerId }
    );
};

export const removeSupportingProvider = async (
    appointmentId,
    providerId
) => {
    return api.delete(
        `/appointments/${appointmentId}/supporting-providers/${providerId}`
    );
};

export const reassignSchedulingProvider = async (
    appointmentId,
    providerId
) => {
    return api.patch(
        `/appointments/${appointmentId}/scheduling-provider`,
        {
            providerId,
        }
    );
};

export const getVisitNotes = async (appointmentId) => {
    return api.get(`/visit-notes/${appointmentId}`);
};

export const addVisitNote = async (appointmentId, text) => {
    return api.post(`/visit-notes/${appointmentId}`, { text });
};

export const updateVisitNote = async (noteId, text) => {
    return api.put(`/visit-notes/note/${noteId}`, { text });
};


export const getAppointmentHistory = async (appointmentId) => {
    return api.get(`/history/${appointmentId}`);
};