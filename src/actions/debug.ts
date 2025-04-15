// src/actions/debug.ts
import { currentUser } from "@clerk/nextjs/server";
import { client } from "@/lib/prisma";

export async function getCosmosHierarchy() {
  try {
    const user = await currentUser();
    if (!user) {
      return { status: 403, data: null };
    }

    const userData = await client.user.findUnique({
      where: {
        clerkId: user.id,
      },
      select: {
        id: true,
        activeCosmosId: true,
        cosmos: {
          select: {
            id: true,
            name: true,
            description: true,
            stellarDrives: {
              select: {
                id: true,
                name: true,
                capacity: true,
                used: true,
                rootFolderId: true,
                folders: {
                  select: {
                    id: true,
                    name: true,
                    inSidebar: true,
                    sidebarOrder: true,
                  },
                },
              },
            },
            constellations: {
              select: {
                id: true,
                name: true,
                description: true,
                appStates: {
                  select: {
                    id: true,
                    appId: true,
                    activeFlowId: true,
                  },
                },
                windowStates: {
                  select: {
                    id: true,
                    appId: true,
                  },
                },
              },
            },
            auras: {
              select: {
                id: true,
                name: true,
                description: true,
                auroras: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    streams: {
                      select: {
                        id: true,
                        name: true,
                        description: true,
                        flows: {
                          select: {
                            id: true,
                            name: true,
                            type: true,
                            appId: true,
                            components: {
                              select: {
                                id: true,
                                name: true,
                                type: true,
                                tokenId: true,
                              },
                              take: 5,
                            },
                          },
                        },
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

    if (!userData) {
      return { status: 404, data: null };
    }

    return { status: 200, data: userData };
  } catch (error) {
    console.error("Error fetching cosmos hierarchy:", error);
    return { status: 500, data: null };
  }
}
