import { api } from "./api";

export const getAlerts = async () => {
    return api.get("/alerts");
};

export const dismissAlert = async (appointmentId) => {
    return api.patch(`/alerts/${appointmentId}/dismiss`);
};
