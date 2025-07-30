import { apiRequest } from "./queryClient";
import type { InsertPlayerRegistration, InsertClan, ClashPlayer } from "@shared/schema";

export const playerApi = {
  register: async (data: InsertPlayerRegistration) => {
    const response = await apiRequest("POST", "/api/player-registrations", data);
    return response.json();
  },
  
  getRegistrations: async () => {
    const response = await apiRequest("GET", "/api/player-registrations");
    return response.json();
  },
  
  clearRegistrations: async () => {
    const response = await apiRequest("DELETE", "/api/player-registrations");
    return response.json();
  },
};

export const clanApi = {
  create: async (data: InsertClan) => {
    const response = await apiRequest("POST", "/api/clans", data);
    return response.json();
  },
  
  getAll: async () => {
    const response = await apiRequest("GET", "/api/clans");
    return response.json();
  },
};

export const cwlApi = {
  generateMessage: async (clans: any[]) => {
    const response = await apiRequest("POST", "/api/generate-message", { clans });
    return response.json();
  },
  
  exportPdf: async (message: string) => {
    const response = await apiRequest("POST", "/api/export-pdf", { message });
    return response.blob();
  },
};

export const clashApi = {
  getPlayers: async (clanTag: string): Promise<ClashPlayer[]> => {
    const response = await apiRequest("GET", `/api/clash-players/${clanTag}`);
    return response.json();
  },
};
