// src/actions/windows.ts
"use server";

import { client } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export interface WindowStateData {
  id?: string;
  appId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  layout?: string; // For HyprLand-style layout (tiling, floating, etc.)
  workspace?: number; // For multi-workspace support
}

export async function getWindowStates() {
  try {
    const user = await currentUser();
    if (!user) return { status: 403, data: [] as WindowStateData[] };

    // Get user's active cosmos and constellation
    const userData = await client.user.findUnique({
      where: { clerkId: user.id },
      select: {
        activeCosmos: {
          select: {
            constellations: {
              take: 1,
              select: {
                id: true,
                windowStates: {
                  select: {
                    id: true,
                    appId: true,
                    position: true,
                    size: true,
                    isMinimized: true,
                    isMaximized: true,
                    zIndex: true,
                    stateData: true, // Will contain layout and workspace info
                  },
                  orderBy: { zIndex: "asc" },
                },
              },
            },
          },
        },
      },
    });

    const constellation = userData?.activeCosmos?.constellations[0];
    if (!constellation) return { status: 404, data: [] as WindowStateData[] };

    // Map and return window states
    const windowStates = constellation.windowStates.map((state) => {
      const stateData = (state.stateData as any) || {};

      return {
        id: state.id,
        appId: state.appId,
        position: state.position as { x: number; y: number },
        size: state.size as { width: number; height: number },
        isMinimized: state.isMinimized,
        isMaximized: state.isMaximized,
        zIndex: state.zIndex,
        layout: stateData.layout || "floating",
        workspace: stateData.workspace || 1,
      };
    });

    return {
      status: 200,
      data: windowStates,
      constellationId: constellation.id,
    };
  } catch (error) {
    console.error("Error fetching window states:", error);
    return { status: 500, data: [] as WindowStateData[] };
  }
}

export async function saveWindowState(windowState: WindowStateData) {
  try {
    const user = await currentUser();
    if (!user) return { status: 403 };

    // Get active constellation
    const userData = await client.user.findUnique({
      where: { clerkId: user.id },
      select: {
        activeCosmos: {
          select: {
            constellations: {
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    });

    const constellationId = userData?.activeCosmos?.constellations[0]?.id;
    if (!constellationId) return { status: 404 };

    // Prepare stateData with HyprLand specific properties
    const stateData = {
      layout: windowState.layout || "floating",
      workspace: windowState.workspace || 1,
    };

    // Create or update window state
    if (windowState.id) {
      // Update existing
      await client.windowState.update({
        where: { id: windowState.id },
        data: {
          position: windowState.position,
          size: windowState.size,
          isMinimized: windowState.isMinimized,
          isMaximized: windowState.isMaximized,
          zIndex: windowState.zIndex,
          stateData,
        },
      });
    } else {
      // Check if window state for this app already exists
      const existingState = await client.windowState.findFirst({
        where: {
          constellationId,
          appId: windowState.appId,
        },
      });

      if (existingState) {
        // Update
        await client.windowState.update({
          where: { id: existingState.id },
          data: {
            position: windowState.position,
            size: windowState.size,
            isMinimized: windowState.isMinimized,
            isMaximized: windowState.isMaximized,
            zIndex: windowState.zIndex,
            stateData,
          },
        });
      } else {
        // Create new
        await client.windowState.create({
          data: {
            appId: windowState.appId,
            position: windowState.position,
            size: windowState.size,
            isMinimized: windowState.isMinimized,
            isMaximized: windowState.isMaximized,
            zIndex: windowState.zIndex,
            stateData,
            constellationId,
          },
        });
      }
    }

    return { status: 200 };
  } catch (error) {
    console.error("Error saving window state:", error);
    return { status: 500 };
  }
}

// Delete window state when closing an app
export async function deleteWindowState(appId: string) {
  try {
    const user = await currentUser();
    if (!user) return { status: 403 };

    const userData = await client.user.findUnique({
      where: { clerkId: user.id },
      select: {
        activeCosmos: {
          select: {
            constellations: {
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    });

    const constellationId = userData?.activeCosmos?.constellations[0]?.id;
    if (!constellationId) return { status: 404 };

    await client.windowState.deleteMany({
      where: {
        constellationId,
        appId,
      },
    });

    return { status: 200 };
  } catch (error) {
    console.error("Error deleting window state:", error);
    return { status: 500 };
  }
}
