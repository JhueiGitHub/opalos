// src/actions/styling.ts

import { client } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function getWallpaperStyle() {
  const user = await currentUser();

  if (!user) {
    // Default if not authenticated
    return { backgroundColor: "#000000", opacity: 1 };
  }

  try {
    // Get user with active cosmos
    const userRecord = await client.user.findUnique({
      where: { clerkId: user.id },
      select: { activeCosmosId: true },
    });

    if (!userRecord?.activeCosmosId) {
      return { backgroundColor: "#000000", opacity: 1 };
    }

    // Find constellations with app states
    const constellation = await client.constellation.findFirst({
      where: { cosmosId: userRecord.activeCosmosId },
      include: {
        appStates: {
          where: { appId: "orion" },
          include: {
            activeFlow: {
              include: {
                components: {
                  where: { name: "Wallpaper" },
                },
                referencesFlow: {
                  include: {
                    components: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!constellation?.appStates[0]?.activeFlow) {
      return { backgroundColor: "#000000", opacity: 1 };
    }

    const configFlow = constellation.appStates[0].activeFlow;
    const wallpaperComponent = configFlow.components[0];

    // If there's a direct value, use it
    if (wallpaperComponent.value && wallpaperComponent.mode === "color") {
      return {
        backgroundColor: wallpaperComponent.value,
        opacity: wallpaperComponent.opacity
          ? wallpaperComponent.opacity / 100
          : 1,
      };
    }

    // If there's a token reference, resolve it
    if (wallpaperComponent.tokenId && configFlow.referencesFlow) {
      const token = configFlow.referencesFlow.components.find(
        (c) => c.name === wallpaperComponent.tokenId
      );

      if (token) {
        return {
          backgroundColor: token.value || "#000000",
          opacity: token.opacity ? token.opacity / 100 : 1,
        };
      }
    }

    // Fallback
    return { backgroundColor: "#000000", opacity: 1 };
  } catch (error) {
    console.error("Error getting wallpaper style:", error);
    return { backgroundColor: "#000000", opacity: 1 };
  }
}

// Define the interface for icon styles
interface IconStyle {
  name: string;
  color: string;
  colorOpacity: number;
  outlineColor: string;
  outlineOpacity: number;
}

export async function getDockIconStyles(): Promise<IconStyle[]> {
  const user = await currentUser();

  if (!user) {
    return []; // Default empty array if not authenticated
  }

  try {
    // Get user with active cosmos
    const userRecord = await client.user.findUnique({
      where: { clerkId: user.id },
      select: { activeCosmosId: true },
    });

    if (!userRecord?.activeCosmosId) {
      return [];
    }

    // Find constellations with Orion app states
    const constellation = await client.constellation.findFirst({
      where: { cosmosId: userRecord.activeCosmosId },
      include: {
        appStates: {
          where: { appId: "orion" },
          include: {
            activeFlow: {
              include: {
                components: {
                  where: { type: "DOCK_ICON" },
                  orderBy: { order: "asc" },
                },
                referencesFlow: {
                  include: {
                    components: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!constellation?.appStates[0]?.activeFlow) {
      return [];
    }

    const configFlow = constellation.appStates[0].activeFlow;
    const dockIconComponents = configFlow.components;

    return dockIconComponents.map((icon) => {
      // Default icon style
      const defaultStyle = {
        name: icon.name,
        color: "#CCCCCC",
        colorOpacity: 0.72, // 72% opacity
        outlineColor: "#4C4F69",
        outlineOpacity: 0.72,
      };

      // If we have a reference flow
      if (configFlow.referencesFlow) {
        // Resolve color token
        if (icon.tokenId) {
          const colorToken = configFlow.referencesFlow.components.find(
            (c) => c.name === icon.tokenId
          );

          if (colorToken && colorToken.value) {
            defaultStyle.color = colorToken.value;
            defaultStyle.colorOpacity = colorToken.opacity
              ? colorToken.opacity / 100
              : 1;
          }
        }

        // Resolve outline token
        if (icon.outlineTokenId) {
          const outlineToken = configFlow.referencesFlow.components.find(
            (c) => c.name === icon.outlineTokenId
          );

          if (outlineToken && outlineToken.value) {
            defaultStyle.outlineColor = outlineToken.value;
            defaultStyle.outlineOpacity = outlineToken.opacity
              ? outlineToken.opacity / 100
              : 1;
          }
        }
      }

      return defaultStyle;
    });
  } catch (error) {
    console.error("Error getting dock icon styles:", error);
    return [];
  }
}
