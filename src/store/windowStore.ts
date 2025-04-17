// src/store/windowStore.ts
import { create } from "zustand";
import {
  getWindowStates,
  saveWindowState,
  deleteWindowState,
} from "@/actions/windows";
import { toast } from "sonner"; // For notifications

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowData {
  id?: string;
  appId: string;
  position: WindowPosition;
  size: WindowSize;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  layout: string; // 'tiling', 'floating', 'maximized'
  workspace: number;
}

interface WindowState {
  // Core window data
  openApps: string[]; // List of open app IDs
  activeAppId: string | null; // Currently focused app
  windowData: Record<string, WindowData>; // Window position/size/state by appId

  // HyprLand features
  currentWorkspace: number;
  workspaces: number[];
  isInitialized: boolean;
  constellationId: string | null;

  // Add this line to fix the errors:
  syncTimeout?: ReturnType<typeof setTimeout> | null;

  // Actions
  initialize: () => Promise<void>;
  openApp: (appId: string) => void;
  closeApp: (appId: string) => void;
  setActiveApp: (appId: string) => void;
  minimizeApp: (appId: string) => void;
  maximizeApp: (appId: string) => void;
  restoreApp: (appId: string) => void;
  toggleMinimize: (appId: string) => void;
  moveWindow: (appId: string, position: WindowPosition) => void;
  resizeWindow: (appId: string, size: WindowSize) => void;
  setLayout: (appId: string, layout: string) => void;
  switchWorkspace: (workspace: number) => void;
  setWindowWorkspace: (appId: string, workspace: number) => void;
  tileWindows: () => void;
  cascadeWindows: () => void;
  syncToDatabase: () => Promise<void>;
  // Add these new actions
  snapWindowLeft: (appId: string) => void;
  snapWindowRight: (appId: string) => void;
  snapWindowTop: (appId: string) => void;
  snapWindowBottom: (appId: string) => void;
  // Corners
  snapWindowTopLeft: (appId: string) => void;
  snapWindowTopRight: (appId: string) => void;
  snapWindowBottomLeft: (appId: string) => void;
  snapWindowBottomRight: (appId: string) => void;
}

// Add these new snap layout constants
export const LAYOUTS = {
  FLOATING: "floating",
  TILING: "tiling",
  MAXIMIZED: "maximized",
  SNAP_LEFT: "snap-left",
  SNAP_RIGHT: "snap-right",
  SNAP_TOP: "snap-top",
  SNAP_BOTTOM: "snap-bottom",
  SNAP_TOP_LEFT: "snap-top-left",
  SNAP_TOP_RIGHT: "snap-top-right",
  SNAP_BOTTOM_LEFT: "snap-bottom-left",
  SNAP_BOTTOM_RIGHT: "snap-bottom-right",
};

export const useWindowStore = create<WindowState>((set, get) => ({
  openApps: [],
  activeAppId: null,
  windowData: {},
  currentWorkspace: 1,
  workspaces: [1],
  isInitialized: false,
  constellationId: null,

  initialize: async () => {
    try {
      const response = await getWindowStates();

      // Handle the case where there's no constellation or window states
      if (response.status === 404) {
        set({
          windowData: {},
          openApps: [],
          workspaces: [1],
          isInitialized: true, // Still mark as initialized
          constellationId: null,
        });
        return;
      }

      if (response.status === 200) {
        const windowsMap: Record<string, WindowData> = {};
        const openApps: string[] = [];
        const workspacesSet = new Set<number>([1]); // Always include workspace 1

        response.data.forEach((window) => {
          windowsMap[window.appId] = {
            id: window.id,
            appId: window.appId,
            position: window.position,
            size: window.size,
            isMinimized: window.isMinimized,
            isMaximized: window.isMaximized,
            zIndex: window.zIndex,
            layout: window.layout || "floating",
            workspace: window.workspace || 1,
          };

          openApps.push(window.appId);
          workspacesSet.add(window.workspace || 1);
        });

        set({
          windowData: windowsMap,
          openApps,
          workspaces: Array.from(workspacesSet).sort(),
          isInitialized: true,
          constellationId: response.constellationId || null,
        });

        // If there's at least one open app, set it as active
        if (openApps.length > 0) {
          // Find the non-minimized app with the highest zIndex
          const visibleApps = openApps.filter(
            (appId) => !windowsMap[appId].isMinimized
          );

          if (visibleApps.length > 0) {
            const highestZIndexApp = visibleApps.reduce((prev, current) =>
              windowsMap[current].zIndex > windowsMap[prev].zIndex
                ? current
                : prev
            );
            set({ activeAppId: highestZIndexApp });
          }
        }
      }
    } catch (error) {
      console.error("Failed to initialize window state:", error);
      // Even on error, set initialized to true to prevent loading screen
      set({ isInitialized: true });
    }
  },

  openApp: (appId) => {
    const state = get();
    const { windowData, openApps } = state;

    // If app is already open
    if (openApps.includes(appId)) {
      // If minimized, restore it
      if (windowData[appId]?.isMinimized) {
        const updatedWindowData = {
          ...windowData,
          [appId]: {
            ...windowData[appId],
            isMinimized: false,
            zIndex:
              Math.max(...Object.values(windowData).map((w) => w.zIndex), 0) +
              1,
          },
        };

        set({
          windowData: updatedWindowData,
          activeAppId: appId,
        });

        // Sync to database
        saveWindowState(updatedWindowData[appId]);
      } else {
        // Just focus it
        const updatedWindowData = {
          ...windowData,
          [appId]: {
            ...windowData[appId],
            zIndex:
              Math.max(...Object.values(windowData).map((w) => w.zIndex), 0) +
              1,
          },
        };

        set({
          windowData: updatedWindowData,
          activeAppId: appId,
        });

        // Sync to database
        saveWindowState(updatedWindowData[appId]);
      }
      return;
    }

    // Calculate default position (cascade new windows)
    const newWindowIndex = openApps.length;
    const baseOffset = 40;
    const offsetX = baseOffset + ((newWindowIndex * 20) % 100);
    const offsetY = baseOffset + ((newWindowIndex * 20) % 100);

    // Calculate zIndex
    const nextZIndex =
      Math.max(...Object.values(windowData).map((w) => w.zIndex), 0) + 1;

    // Default settings for new window
    const newWindowData: WindowData = {
      appId,
      position: { x: offsetX, y: offsetY },
      size: { width: 800, height: 600 },
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex,
      layout: "floating",
      workspace: state.currentWorkspace,
    };

    const updatedWindowData = {
      ...windowData,
      [appId]: newWindowData,
    };

    set({
      openApps: [...openApps, appId],
      windowData: updatedWindowData,
      activeAppId: appId,
    });

    // Sync to database
    saveWindowState(newWindowData);
  },

  closeApp: (appId) => {
    const { openApps, windowData, activeAppId } = get();

    // Remove from open apps
    const newOpenApps = openApps.filter((id) => id !== appId);

    // Create new windowData without this app
    const { [appId]: removedWindow, ...remainingWindows } = windowData;

    // Update active app if needed
    let newActiveAppId = activeAppId;
    if (activeAppId === appId) {
      // Find next app to focus based on zIndex
      const visibleApps = newOpenApps.filter(
        (id) => !windowData[id].isMinimized
      );

      if (visibleApps.length > 0) {
        newActiveAppId = visibleApps.reduce((prev, current) =>
          windowData[current].zIndex > windowData[prev].zIndex ? current : prev
        );
      } else {
        newActiveAppId = null;
      }
    }

    set({
      openApps: newOpenApps,
      windowData: remainingWindows,
      activeAppId: newActiveAppId,
    });

    // Remove from database
    deleteWindowState(appId);
  },

  setActiveApp: (appId) => {
    const { windowData } = get();
    if (!windowData[appId]) return;

    // Update zIndex
    const nextZIndex =
      Math.max(...Object.values(windowData).map((w) => w.zIndex), 0) + 1;

    const updatedWindowData = {
      ...windowData,
      [appId]: {
        ...windowData[appId],
        zIndex: nextZIndex,
        isMinimized: false, // Ensure window is not minimized when activated
      },
    };

    set({
      windowData: updatedWindowData,
      activeAppId: appId,
    });

    // Sync to database
    saveWindowState(updatedWindowData[appId]);
  },

  minimizeApp: (appId) => {
    const { windowData, activeAppId } = get();
    if (!windowData[appId]) return;

    const updatedWindowData = {
      ...windowData,
      [appId]: {
        ...windowData[appId],
        isMinimized: true,
      },
    };

    // Update active app if needed
    let newActiveAppId = activeAppId;
    if (activeAppId === appId) {
      newActiveAppId = null;
    }

    set({
      windowData: updatedWindowData,
      activeAppId: newActiveAppId,
    });

    // Sync to database
    saveWindowState(updatedWindowData[appId]);
  },

  maximizeApp: (appId) => {
    const { windowData } = get();
    if (!windowData[appId]) return;

    const updatedWindowData = {
      ...windowData,
      [appId]: {
        ...windowData[appId],
        isMaximized: true,
        isMinimized: false, // Ensure window is not minimized
        layout: "maximized",
      },
    };

    set({
      windowData: updatedWindowData,
      activeAppId: appId,
    });

    // Sync to database
    saveWindowState(updatedWindowData[appId]);
  },

  restoreApp: (appId) => {
    const { windowData } = get();
    if (!windowData[appId]) return;

    const updatedWindowData = {
      ...windowData,
      [appId]: {
        ...windowData[appId],
        isMaximized: false,
        isMinimized: false,
        layout: "floating",
      },
    };

    set({
      windowData: updatedWindowData,
      activeAppId: appId,
    });

    // Sync to database
    saveWindowState(updatedWindowData[appId]);
  },

  toggleMinimize: (appId) => {
    const { windowData, activeAppId } = get();
    if (!windowData[appId]) return;

    const isCurrentlyMinimized = windowData[appId].isMinimized;

    const updatedWindowData = {
      ...windowData,
      [appId]: {
        ...windowData[appId],
        isMinimized: !isCurrentlyMinimized,
        zIndex: !isCurrentlyMinimized
          ? windowData[appId].zIndex
          : Math.max(...Object.values(windowData).map((w) => w.zIndex), 0) + 1,
      },
    };

    set({
      windowData: updatedWindowData,
      activeAppId: isCurrentlyMinimized
        ? appId
        : activeAppId === appId
        ? null
        : activeAppId,
    });

    // Sync to database
    saveWindowState(updatedWindowData[appId]);
  },

  moveWindow: (appId, position) => {
    const { windowData } = get();
    if (!windowData[appId]) return;

    const updatedWindowData = {
      ...windowData,
      [appId]: {
        ...windowData[appId],
        position,
        // If layout was tiling or maximized, switch to floating
        layout:
          windowData[appId].layout !== "floating"
            ? "floating"
            : windowData[appId].layout,
      },
    };

    set({ windowData: updatedWindowData });

    // Debounce the database sync to avoid too many updates
    const windowState = get();
    if (windowState.syncTimeout) {
      clearTimeout(windowState.syncTimeout);
    }

    set({
      syncTimeout: setTimeout(() => {
        saveWindowState(updatedWindowData[appId]);
      }, 500),
    });
  },

  resizeWindow: (appId, size) => {
    const { windowData } = get();
    if (!windowData[appId]) return;

    const updatedWindowData = {
      ...windowData,
      [appId]: {
        ...windowData[appId],
        size,
        // If layout was tiling or maximized, switch to floating
        layout:
          windowData[appId].layout !== "floating"
            ? "floating"
            : windowData[appId].layout,
      },
    };

    set({ windowData: updatedWindowData });

    // Debounce the database sync
    const windowState = get();
    if (windowState.syncTimeout) {
      clearTimeout(windowState.syncTimeout);
    }

    set({
      syncTimeout: setTimeout(() => {
        saveWindowState(updatedWindowData[appId]);
      }, 500),
    });
  },

  setLayout: (appId, layout) => {
    const { windowData } = get();
    if (!windowData[appId]) return;

    const updatedWindowData = {
      ...windowData,
      [appId]: {
        ...windowData[appId],
        layout,
      },
    };

    set({ windowData: updatedWindowData });

    // Sync to database
    saveWindowState(updatedWindowData[appId]);
  },

  switchWorkspace: (workspace) => {
    set({ currentWorkspace: workspace });
  },

  setWindowWorkspace: (appId, workspace) => {
    const { windowData, workspaces } = get();
    if (!windowData[appId]) return;

    // Ensure this workspace exists
    const updatedWorkspaces = workspaces.includes(workspace)
      ? workspaces
      : [...workspaces, workspace].sort();

    const updatedWindowData = {
      ...windowData,
      [appId]: {
        ...windowData[appId],
        workspace,
      },
    };

    set({
      windowData: updatedWindowData,
      workspaces: updatedWorkspaces,
    });

    // Sync to database
    saveWindowState(updatedWindowData[appId]);
  },

  tileWindows: () => {
    const { openApps, windowData, currentWorkspace } = get();

    // Get visible apps in the current workspace
    const visibleApps = openApps.filter(
      (appId) =>
        !windowData[appId].isMinimized &&
        windowData[appId].workspace === currentWorkspace
    );

    if (visibleApps.length === 0) return;

    // Simple tiling algorithm
    const tiledWindows = { ...windowData };

    if (visibleApps.length === 1) {
      // Just one window - maximize it
      const appId = visibleApps[0];
      tiledWindows[appId] = {
        ...tiledWindows[appId],
        position: { x: 0, y: 0 },
        size: { width: window.innerWidth, height: window.innerHeight }, // Account for dock
        layout: "tiling",
      };
    } else if (visibleApps.length === 2) {
      // Two windows - split horizontally
      const [app1, app2] = visibleApps;

      tiledWindows[app1] = {
        ...tiledWindows[app1],
        position: { x: 0, y: 0 },
        size: { width: window.innerWidth / 2, height: window.innerHeight },
        layout: "tiling",
      };

      tiledWindows[app2] = {
        ...tiledWindows[app2],
        position: { x: window.innerWidth / 2, y: 0 },
        size: { width: window.innerWidth / 2, height: window.innerHeight },
        layout: "tiling",
      };
    } else if (visibleApps.length === 3) {
      // Three windows - one on left, two stacked on right
      const [app1, app2, app3] = visibleApps;

      tiledWindows[app1] = {
        ...tiledWindows[app1],
        position: { x: 0, y: 0 },
        size: { width: window.innerWidth / 2, height: window.innerHeight },
        layout: "tiling",
      };

      tiledWindows[app2] = {
        ...tiledWindows[app2],
        position: { x: window.innerWidth / 2, y: 0 },
        size: {
          width: window.innerWidth / 2,
          height: window.innerHeight / 2,
        },
        layout: "tiling",
      };

      tiledWindows[app3] = {
        ...tiledWindows[app3],
        position: {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        },
        size: {
          width: window.innerWidth / 2,
          height: window.innerHeight / 2,
        },
        layout: "tiling",
      };
    } else {
      // Four or more windows - grid layout
      const cols = Math.ceil(Math.sqrt(visibleApps.length));
      const rows = Math.ceil(visibleApps.length / cols);

      const cellWidth = window.innerWidth / cols;
      const cellHeight = window.innerHeight / rows;

      visibleApps.forEach((appId, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;

        tiledWindows[appId] = {
          ...tiledWindows[appId],
          position: { x: col * cellWidth, y: row * cellHeight },
          size: { width: cellWidth, height: cellHeight },
          layout: "tiling",
        };
      });
    }

    set({ windowData: tiledWindows });

    // Sync all windows to database
    visibleApps.forEach((appId) => {
      saveWindowState(tiledWindows[appId]);
    });

    toast.success("Windows tiled");
  },

  cascadeWindows: () => {
    const { openApps, windowData, currentWorkspace } = get();

    // Get visible apps in the current workspace
    const visibleApps = openApps.filter(
      (appId) =>
        !windowData[appId].isMinimized &&
        windowData[appId].workspace === currentWorkspace
    );

    if (visibleApps.length === 0) return;

    // Cascade algorithm
    const cascadedWindows = { ...windowData };
    const stepX = 30;
    const stepY = 30;
    const baseWidth = 800;
    const baseHeight = 600;

    visibleApps.forEach((appId, index) => {
      cascadedWindows[appId] = {
        ...cascadedWindows[appId],
        position: { x: stepX * index, y: stepY * index },
        size: { width: baseWidth, height: baseHeight },
        layout: "floating",
        zIndex: visibleApps.length - index, // Stack them in order
      };
    });

    set({ windowData: cascadedWindows });

    // Sync all windows to database
    visibleApps.forEach((appId) => {
      saveWindowState(cascadedWindows[appId]);
    });

    toast.success("Windows cascaded");
  },

  syncToDatabase: async () => {
    const { windowData } = get();

    // Sync all open windows to database
    for (const appId in windowData) {
      await saveWindowState(windowData[appId]);
    }
  },
  snapWindowLeft: (appId) => {
    const { windowData } = get();
    if (!windowData[appId]) return;

    const updatedWindowData = {
      ...windowData,
      [appId]: {
        ...windowData[appId],
        isMaximized: false,
        isMinimized: false,
        position: { x: 0, y: 0 },
        size: { width: window.innerWidth / 2, height: window.innerHeight },
        layout: LAYOUTS.SNAP_LEFT,
        zIndex:
          Math.max(...Object.values(windowData).map((w) => w.zIndex), 0) + 1,
      },
    };

    set({
      windowData: updatedWindowData,
      activeAppId: appId,
    });

    // Sync to database
    saveWindowState(updatedWindowData[appId]);
  },

  snapWindowRight: (appId) => {
    const { windowData } = get();
    if (!windowData[appId]) return;

    const updatedWindowData = {
      ...windowData,
      [appId]: {
        ...windowData[appId],
        isMaximized: false,
        isMinimized: false,
        position: { x: window.innerWidth / 2, y: 0 },
        size: { width: window.innerWidth / 2, height: window.innerHeight },
        layout: LAYOUTS.SNAP_RIGHT,
        zIndex:
          Math.max(...Object.values(windowData).map((w) => w.zIndex), 0) + 1,
      },
    };

    set({
      windowData: updatedWindowData,
      activeAppId: appId,
    });

    // Sync to database
    saveWindowState(updatedWindowData[appId]);
  },

  snapWindowTop: (appId) => {
    const { windowData } = get();
    if (!windowData[appId]) return;

    const updatedWindowData = {
      ...windowData,
      [appId]: {
        ...windowData[appId],
        isMaximized: false,
        isMinimized: false,
        position: { x: 0, y: 0 },
        size: {
          width: window.innerWidth,
          height: window.innerHeight / 2,
        },
        layout: LAYOUTS.SNAP_TOP,
        zIndex:
          Math.max(...Object.values(windowData).map((w) => w.zIndex), 0) + 1,
      },
    };

    set({
      windowData: updatedWindowData,
      activeAppId: appId,
    });

    // Sync to database
    saveWindowState(updatedWindowData[appId]);
  },

  snapWindowBottom: (appId) => {
    const { windowData } = get();
    if (!windowData[appId]) return;

    const updatedWindowData = {
      ...windowData,
      [appId]: {
        ...windowData[appId],
        isMaximized: false,
        isMinimized: false,
        position: { x: 0, y: window.innerHeight / 2 },
        size: {
          width: window.innerWidth,
          height: window.innerHeight / 2,
        },
        layout: LAYOUTS.SNAP_BOTTOM,
        zIndex:
          Math.max(...Object.values(windowData).map((w) => w.zIndex), 0) + 1,
      },
    };

    set({
      windowData: updatedWindowData,
      activeAppId: appId,
    });

    // Sync to database
    saveWindowState(updatedWindowData[appId]);
  },

  // Corner snaps
  snapWindowTopLeft: (appId) => {
    const { windowData } = get();
    if (!windowData[appId]) return;

    const updatedWindowData = {
      ...windowData,
      [appId]: {
        ...windowData[appId],
        isMaximized: false,
        isMinimized: false,
        position: { x: 0, y: 0 },
        size: {
          width: window.innerWidth / 2,
          height: window.innerHeight / 2,
        },
        layout: LAYOUTS.SNAP_TOP_LEFT,
        zIndex:
          Math.max(...Object.values(windowData).map((w) => w.zIndex), 0) + 1,
      },
    };

    set({
      windowData: updatedWindowData,
      activeAppId: appId,
    });

    // Sync to database
    saveWindowState(updatedWindowData[appId]);
  },

  snapWindowTopRight: (appId) => {
    const { windowData } = get();
    if (!windowData[appId]) return;

    const updatedWindowData = {
      ...windowData,
      [appId]: {
        ...windowData[appId],
        isMaximized: false,
        isMinimized: false,
        position: { x: window.innerWidth / 2, y: 0 },
        size: {
          width: window.innerWidth / 2,
          height: window.innerHeight / 2,
        },
        layout: LAYOUTS.SNAP_TOP_RIGHT,
        zIndex:
          Math.max(...Object.values(windowData).map((w) => w.zIndex), 0) + 1,
      },
    };

    set({
      windowData: updatedWindowData,
      activeAppId: appId,
    });

    // Sync to database
    saveWindowState(updatedWindowData[appId]);
  },

  snapWindowBottomLeft: (appId) => {
    const { windowData } = get();
    if (!windowData[appId]) return;

    const updatedWindowData = {
      ...windowData,
      [appId]: {
        ...windowData[appId],
        isMaximized: false,
        isMinimized: false,
        position: { x: 0, y: window.innerHeight / 2 },
        size: {
          width: window.innerWidth / 2,
          height: window.innerHeight / 2,
        },
        layout: LAYOUTS.SNAP_BOTTOM_LEFT,
        zIndex:
          Math.max(...Object.values(windowData).map((w) => w.zIndex), 0) + 1,
      },
    };

    set({
      windowData: updatedWindowData,
      activeAppId: appId,
    });

    // Sync to database
    saveWindowState(updatedWindowData[appId]);
  },

  snapWindowBottomRight: (appId) => {
    const { windowData } = get();
    if (!windowData[appId]) return;

    const updatedWindowData = {
      ...windowData,
      [appId]: {
        ...windowData[appId],
        isMaximized: false,
        isMinimized: false,
        position: {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        },
        size: {
          width: window.innerWidth / 2,
          height: window.innerHeight / 2,
        },
        layout: LAYOUTS.SNAP_BOTTOM_RIGHT,
        zIndex:
          Math.max(...Object.values(windowData).map((w) => w.zIndex), 0) + 1,
      },
    };

    set({
      windowData: updatedWindowData,
      activeAppId: appId,
    });

    // Sync to database
    saveWindowState(updatedWindowData[appId]);
  },
}));
