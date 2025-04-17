// src/actions/cosmos.ts
"use server";

import { client } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export interface CosmosInfo {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export async function getUserCosmos() {
  try {
    const user = await currentUser();
    if (!user) return { status: 403, data: [] as CosmosInfo[] };

    // Get user with active cosmos ID
    const userData = await client.user.findUnique({
      where: { clerkId: user.id },
      select: {
        activeCosmosId: true,
        cosmos: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!userData) return { status: 404, data: [] as CosmosInfo[] };

    // Map cosmos data with isActive flag
    const cosmosData: CosmosInfo[] = userData.cosmos.map((cosmos) => ({
      id: cosmos.id,
      name: cosmos.name,
      description: cosmos.description,
      isActive: cosmos.id === userData.activeCosmosId,
    }));

    return { status: 200, data: cosmosData };
  } catch (error) {
    console.error("Error fetching cosmos list:", error);
    return { status: 500, data: [] as CosmosInfo[] };
  }
}

export async function setActiveCosmos(cosmosId: string) {
  try {
    const user = await currentUser();
    if (!user) return { status: 403 };

    // Update user's active cosmos
    await client.user.update({
      where: { clerkId: user.id },
      data: { activeCosmosId: cosmosId },
    });

    return { status: 200 };
  } catch (error) {
    console.error("Error setting active cosmos:", error);
    return { status: 500 };
  }
}

export async function createCosmos(name: string, description?: string) {
  try {
    const user = await currentUser();
    if (!user) return { status: 403, data: null };

    // Get user data
    const userData = await client.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true },
    });

    if (!userData) return { status: 404, data: null };

    // Use transaction to create cosmos with default constellation
    const newCosmos = await client.$transaction(async (tx) => {
      // Create new cosmos
      const cosmos = await tx.cosmos.create({
        data: {
          name,
          description: description || null,
          userId: userData.id,
        },
      });

      // Create default constellation
      const constellation = await tx.constellation.create({
        data: {
          name: "Default",
          description: "Default Constellation",
          cosmosId: cosmos.id,
          // Initialize empty window states and dock config
          dockConfig: {
            create: {},
          },
        },
      });

      return cosmos;
    });

    return {
      status: 201,
      data: {
        id: newCosmos.id,
        name: newCosmos.name,
        description: newCosmos.description,
        isActive: false,
      },
    };
  } catch (error) {
    console.error("Error creating cosmos:", error);
    return { status: 500, data: null };
  }
}

export async function deleteCosmos(cosmosId: string) {
  try {
    const user = await currentUser();
    if (!user) return { status: 403 };

    // Get user data to verify ownership
    const userData = await client.user.findUnique({
      where: { clerkId: user.id },
      select: {
        id: true,
        activeCosmosId: true,
        cosmos: {
          where: { id: cosmosId },
          select: { id: true },
        },
      },
    });

    if (!userData) return { status: 404 };

    // Verify user owns the cosmos
    if (userData.cosmos.length === 0) {
      return { status: 403, message: "You don't own this cosmos" };
    }

    // Don't allow deleting the active cosmos
    if (userData.activeCosmosId === cosmosId) {
      return { status: 400, message: "Cannot delete active cosmos" };
    }

    // Delete cosmos
    await client.cosmos.delete({
      where: { id: cosmosId },
    });

    return { status: 200 };
  } catch (error) {
    console.error("Error deleting cosmos:", error);
    return { status: 500 };
  }
}
