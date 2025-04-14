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
