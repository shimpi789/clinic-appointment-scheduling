import { api } from "./api";

export const getSlots = async (params = {}) => {
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
        `/slots${queryString ? `?${queryString}` : ""}`
    );
};

export const getMySlots = async () => {
    return api.get("/slots/my");
};

export const createSlot = async (slotData) => {
    return api.post("/slots", slotData);
};

export const updateSlot = async (slotId, slotData) => {
    return api.put(`/slots/${slotId}`, slotData);
};

export const archiveSlot = async (slotId) => {
    return api.patch(`/slots/${slotId}/archive`);
};

export const restoreSlot = async (slotId) => {
    return api.patch(`/slots/${slotId}/restore`);
};

export const bulkCreateSlots = async (bulkData) => {
    return api.post("/slots/bulk", bulkData);
};