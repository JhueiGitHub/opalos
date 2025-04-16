// src/store/windowStore.ts
import { create } from "zustand";

interface WindowState {
  openApps: string[]; // List of open app IDs
  activeAppId: string | null; // Currently focused app
  minimizedApps: string[]; // List of minimized app IDs

  // Actions
  openApp: (appId: string) => void;
  closeApp: (appId: string) => void;
  setActiveApp: (appId: string) => void;
  minimizeApp: (appId: string) => void;
  toggleMinimize: (appId: string) => void;
}

export const useWindowStore = create<WindowState>((set) => ({
  openApps: [],
  activeAppId: null,
  minimizedApps: [],

  openApp: (appId) =>
    set((state) => {
      // Don't add if already open
      if (state.openApps.includes(appId)) {
        // If minimized, un-minimize it
        return {
          ...state,
          activeAppId: appId,
          minimizedApps: state.minimizedApps.filter((id) => id !== appId),
        };
      }

      return {
        openApps: [...state.openApps, appId],
        activeAppId: appId,
        minimizedApps: state.minimizedApps,
      };
    }),

  closeApp: (appId) =>
    set((state) => ({
      openApps: state.openApps.filter((id) => id !== appId),
      activeAppId: state.activeAppId === appId ? null : state.activeAppId,
      minimizedApps: state.minimizedApps.filter((id) => id !== appId),
    })),

  setActiveApp: (appId) =>
    set((state) => ({
      ...state,
      activeAppId: appId,
      minimizedApps: state.minimizedApps.filter((id) => id !== appId),
    })),

  minimizeApp: (appId) =>
    set((state) => ({
      ...state,
      minimizedApps: [...state.minimizedApps, appId],
      activeAppId: state.activeAppId === appId ? null : state.activeAppId,
    })),

  toggleMinimize: (appId) =>
    set((state) => {
      const isMinimized = state.minimizedApps.includes(appId);
      return {
        ...state,
        minimizedApps: isMinimized
          ? state.minimizedApps.filter((id) => id !== appId)
          : [...state.minimizedApps, appId],
        activeAppId: isMinimized
          ? appId
          : state.activeAppId === appId
          ? null
          : state.activeAppId,
      };
    }),
}));
