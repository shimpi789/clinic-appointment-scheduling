import { api } from "./api";

export const getDashboard = async () => {
    return api.get("/dashboard");
};