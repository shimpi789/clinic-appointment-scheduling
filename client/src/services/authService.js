import { api } from "./api";

export const getProviders = async () => {
    return api.get("/auth/providers");
};