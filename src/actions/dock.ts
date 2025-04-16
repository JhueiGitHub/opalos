// src/actions/dock.ts
"use server";

import { client } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

// Define types for our app registry
interface AppDefinition {
  name: string;
  icon: string;
}

export interface DockItem {
  id: string;
  appId: string;
  position: number;
  app: AppDefinition;
  style?: {
    color?: string;
    colorOpacity?: number;
    outlineColor?: string;
    outlineOpacity?: number;
  };
}

// Type-safe app registry
const APP_REGISTRY: Record<string, AppDefinition> = {
  stellar: {
    name: "Stellar",
    icon: "IconFolder",
  },
  flow: {
    name: "Flow",
    icon: "IconPalette",
  },
  studio: {
    name: "Studio",
    icon: "IconVideo",
  },
  // Add other apps as needed
};

export async function getActiveDockItems() {
  try {
    const user = await currentUser();
    if (!user) return { status: 403, data: [] as DockItem[] };
    
    // Get user's active cosmos and its active constellation
    const userData = await client.user.findUnique({
      where: { clerkId: user.id },
      select: {
        activeCosmos: {
          select: {
            constellations: {
              take: 1,
              select: {
                dockConfig: {
                  include: {
                    items: {
                      orderBy: { position: "asc" },
                      include: {
                        flowComponent: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    
    const dockConfig = userData?.activeCosmos?.constellations[0]?.dockConfig;
    if (!dockConfig) return { status: 404, data: [] as DockItem[] };
    
    // Map to include app info from registry
    const enrichedItems: DockItem[] = dockConfig.items.map((item) => {
      // Type-safe access to app registry
      const appInfo = item.appId in APP_REGISTRY 
        ? APP_REGISTRY[item.appId] 
        : { name: item.appId, icon: "IconFolder" };
        
      return {
        id: item.id,
        appId: item.appId,
        position: item.position,
        app: appInfo,
        // You can add style information here from flowComponent
      };
    });
    
    return { status: 200, data: enrichedItems };
  } catch (error) {
    console.error("Error fetching dock items:", error);
    return { status: 500, data: [] as DockItem[] };
  }
}