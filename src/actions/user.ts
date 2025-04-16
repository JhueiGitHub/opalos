// root/src/actions/user.ts

"use server";

// src/actions/user.ts

import { currentUser } from "@clerk/nextjs/server";
import { client } from "@/lib/prisma";
import { FlowType, PRESET } from "@prisma/client";

export const onAuthenticateUser = async () => {
  try {
    const user = await currentUser();
    if (!user) {
      return { status: 403 };
    }

    // Check if user already exists - unchanged
    const userExist = await client.user.findUnique({
      where: {
        clerkId: user.id,
      },
      include: {
        workspace: {
          where: {
            User: {
              clerkId: user.id,
            },
          },
        },
      },
    });

    if (userExist) {
      return { status: 200, user: userExist };
    }

    // Create new user with all necessary data
    const newUser = await client.$transaction(async (tx) => {
      // 1. Create basic user with Opal components - unchanged
      const createdUser = await tx.user.create({
        data: {
          clerkId: user.id,
          email: user.emailAddresses[0].emailAddress,
          firstname: user.firstName,
          lastname: user.lastName,
          image: user.imageUrl,
          studio: {
            create: {
              preset: PRESET.SD,
            },
          },
          subscription: {
            create: {
              plan: "FREE",
            },
          },
          workspace: {
            create: {
              name: `${user.firstName}'s Workspace`,
              type: "PERSONAL",
            },
          },
        },
        include: {
          workspace: {
            where: {
              User: {
                clerkId: user.id,
              },
            },
          },
          subscription: {
            select: {
              plan: true,
            },
          },
        },
      });

      // 2. Create default Cosmos
      const cosmos = await tx.cosmos.create({
        data: {
          name: "Dopa",
          description: "Default Cosmos",
          userId: createdUser.id,
        },
      });

      // 3. Update user with active cosmos
      await tx.user.update({
        where: { id: createdUser.id },
        data: { activeCosmosId: cosmos.id },
      });

      // 4. Create StellarDrive
      const stellarDrive = await tx.stellarDrive.create({
        data: {
          name: `${user.firstName}'s Drive`,
          capacity: BigInt(1000000000), // 1GB
          used: 0,
          cosmosId: cosmos.id,
          settings: {
            defaultView: "grid",
            sortBy: "name",
            showHidden: false,
          },
        },
      });

      // 5. Create root folder and update drive
      const rootFolder = await tx.stellarFolder.create({
        data: {
          name: "Root",
          driveId: stellarDrive.id,
          position: { x: 0, y: 0 },
        },
      });

      await tx.stellarDrive.update({
        where: { id: stellarDrive.id },
        data: { rootFolderId: rootFolder.id },
      });

      // 6. Create standard folders
      const GRID_SPACING = 100;
      const INITIAL_OFFSET = 50;
      const standardFolders = [
        {
          name: "Desktop",
          inSidebar: true,
          sidebarOrder: 0,
          position: { x: INITIAL_OFFSET, y: INITIAL_OFFSET },
        },
        {
          name: "Documents",
          inSidebar: true,
          sidebarOrder: 1,
          position: { x: INITIAL_OFFSET + GRID_SPACING, y: INITIAL_OFFSET },
        },
        {
          name: "Downloads",
          inSidebar: true,
          sidebarOrder: 2,
          position: { x: INITIAL_OFFSET + GRID_SPACING * 2, y: INITIAL_OFFSET },
        },
        {
          name: "Pictures",
          inSidebar: true,
          sidebarOrder: 3,
          position: { x: INITIAL_OFFSET + GRID_SPACING * 3, y: INITIAL_OFFSET },
        },
      ];

      for (const folderData of standardFolders) {
        await tx.stellarFolder.create({
          data: {
            name: folderData.name,
            driveId: stellarDrive.id,
            parentId: rootFolder.id,
            inSidebar: folderData.inSidebar,
            sidebarOrder: folderData.sidebarOrder,
            position: folderData.position,
          },
        });
      }

      // 7. Create default Constellation for OS state
      const constellation = await tx.constellation.create({
        data: {
          name: "Orion",
          description: "Default Constellation",
          cosmosId: cosmos.id,
        },
      });

      // 8. Create default Aura
      const aura = await tx.aura.create({
        data: {
          name: "Noire",
          description: "Default Aura",
          cosmosId: cosmos.id,
        },
      });

      // 9. Create default Aurora
      const aurora = await tx.aurora.create({
        data: {
          name: "Luna",
          description: "Default Aurora",
          auraId: aura.id,
        },
      });

      // 10. Create Core Stream
      const coreStream = await tx.stream.create({
        data: {
          name: "Core",
          description: "Default Core Stream",
          auroraId: aurora.id,
        },
      });

      // 11. Create Config Stream
      const configStream = await tx.stream.create({
        data: {
          name: "Config",
          description: "Default Orion Config Stream",
          auroraId: aurora.id,
        },
      });

      // 12. Create Core Flow with all Zenith color components
      const coreFlow = await tx.flow.create({
        data: {
          name: "Zenith",
          description: "Default Core Flow",
          type: FlowType.CORE,
          streamId: coreStream.id,
          components: {
            createMany: {
              data: [
                // Base colors at 100% opacity
                {
                  name: "black",
                  type: "COLOR",
                  value: "#000000",
                  opacity: 100,
                  order: 1,
                },
                {
                  name: "graphite",
                  type: "COLOR",
                  value: "#292929",
                  opacity: 100,
                  order: 2,
                },
                {
                  name: "smoke",
                  type: "COLOR",
                  value: "#CCCCCC",
                  opacity: 100,
                  order: 3,
                },
                {
                  name: "latte",
                  type: "COLOR",
                  value: "#4C4F69",
                  opacity: 100,
                  order: 4,
                },

                // Color variants with strengths
                {
                  name: "black-thick",
                  type: "COLOR",
                  value: "#000000",
                  opacity: 81,
                  order: 5,
                },
                {
                  name: "black-med",
                  type: "COLOR",
                  value: "#000000",
                  opacity: 72,
                  order: 6,
                },
                {
                  name: "black-thin",
                  type: "COLOR",
                  value: "#000000",
                  opacity: 54,
                  order: 7,
                },
                {
                  name: "black-glass",
                  type: "COLOR",
                  value: "#000000",
                  opacity: 30,
                  order: 8,
                },

                {
                  name: "graphite-thick",
                  type: "COLOR",
                  value: "#292929",
                  opacity: 81,
                  order: 9,
                },
                {
                  name: "graphite-med",
                  type: "COLOR",
                  value: "#292929",
                  opacity: 72,
                  order: 10,
                },
                {
                  name: "graphite-thin",
                  type: "COLOR",
                  value: "#292929",
                  opacity: 54,
                  order: 11,
                },
                {
                  name: "graphite-glass",
                  type: "COLOR",
                  value: "#292929",
                  opacity: 30,
                  order: 12,
                },

                {
                  name: "smoke-thick",
                  type: "COLOR",
                  value: "#CCCCCC",
                  opacity: 81,
                  order: 13,
                },
                {
                  name: "smoke-med",
                  type: "COLOR",
                  value: "#CCCCCC",
                  opacity: 72,
                  order: 14,
                },
                {
                  name: "smoke-thin",
                  type: "COLOR",
                  value: "#CCCCCC",
                  opacity: 54,
                  order: 15,
                },
                {
                  name: "smoke-glass",
                  type: "COLOR",
                  value: "#CCCCCC",
                  opacity: 30,
                  order: 16,
                },

                {
                  name: "latte-thick",
                  type: "COLOR",
                  value: "#4C4F69",
                  opacity: 81,
                  order: 17,
                },
                {
                  name: "latte-med",
                  type: "COLOR",
                  value: "#4C4F69",
                  opacity: 72,
                  order: 18,
                },
                {
                  name: "latte-thin",
                  type: "COLOR",
                  value: "#4C4F69",
                  opacity: 54,
                  order: 19,
                },
                {
                  name: "latte-glass",
                  type: "COLOR",
                  value: "#4C4F69",
                  opacity: 30,
                  order: 20,
                },

                // Accent colors and specific variants
                {
                  name: "daimon",
                  type: "COLOR",
                  value: "#694C4C",
                  opacity: 100,
                  order: 21,
                },
                {
                  name: "onyx",
                  type: "COLOR",
                  value: "#5E4C69",
                  opacity: 100,
                  order: 22,
                },
                {
                  name: "mariana",
                  type: "COLOR",
                  value: "#4C6957",
                  opacity: 100,
                  order: 23,
                },

                // Special inner/outer cursor colors
                {
                  name: "latte-inner",
                  type: "COLOR",
                  value: "#1E202A",
                  opacity: 100,
                  order: 24,
                },
                {
                  name: "latte-outer",
                  type: "COLOR",
                  value: "#4C4F69",
                  opacity: 100,
                  order: 25,
                },
                {
                  name: "daimon-inner",
                  type: "COLOR",
                  value: "#281719",
                  opacity: 100,
                  order: 26,
                },
                {
                  name: "daimon-outer",
                  type: "COLOR",
                  value: "#5F3A3E",
                  opacity: 100,
                  order: 27,
                },
                {
                  name: "onyx-inner",
                  type: "COLOR",
                  value: "#262331",
                  opacity: 100,
                  order: 28,
                },
                {
                  name: "onyx-outer",
                  type: "COLOR",
                  value: "#534C6A",
                  opacity: 100,
                  order: 29,
                },
                {
                  name: "mariana-inner",
                  type: "COLOR",
                  value: "#152020",
                  opacity: 100,
                  order: 30,
                },
                {
                  name: "mariana-outer",
                  type: "COLOR",
                  value: "#375454",
                  opacity: 100,
                  order: 31,
                },

                // Typography tokens
                {
                  name: "exemplar",
                  type: "TYPOGRAPHY",
                  fontFamily: "ExemplarPro",
                  order: 32,
                },
                {
                  name: "dank",
                  type: "TYPOGRAPHY",
                  fontFamily: "Dank Mono",
                  order: 33,
                },
                {
                  name: "inter",
                  type: "TYPOGRAPHY",
                  fontFamily: "Inter",
                  order: 34,
                },
              ],
            },
          },
        },
      });

      // 13. Create Config Flow for Orion OS with mappings
      const orionConfigFlow = await tx.flow.create({
        data: {
          name: "Zenithn",
          description: "Default Orion Config Flow",
          type: FlowType.CONFIG,
          appId: "orion",
          streamId: configStream.id,
          referencesFlowId: coreFlow.id,
          components: {
            createMany: {
              data: [
                {
                  name: "Wallpaper",
                  type: "WALLPAPER",
                  mode: "color",
                  tokenId: "black",
                  order: 0,
                },
                {
                  name: "Finder",
                  type: "DOCK_ICON",
                  mode: "color",
                  tokenId: "black",
                  outlineMode: "color",
                  outlineTokenId: "latte",
                  order: 1,
                },
                {
                  name: "Flow",
                  type: "DOCK_ICON",
                  mode: "color",
                  tokenId: "black",
                  outlineMode: "color",
                  outlineTokenId: "latte",
                  order: 2,
                },
                {
                  name: "Discord",
                  type: "DOCK_ICON",
                  mode: "color",
                  tokenId: "black",
                  outlineMode: "color",
                  outlineTokenId: "latte-med",
                  order: 3,
                },
                {
                  name: "Anki",
                  type: "DOCK_ICON",
                  mode: "color",
                  tokenId: "black",
                  outlineMode: "color",
                  outlineTokenId: "latte-med",
                  order: 4,
                },
                {
                  name: "Stellar",
                  type: "DOCK_ICON",
                  mode: "color",
                  tokenId: "latte",
                  outlineMode: "color",
                  outlineTokenId: "black",
                  order: 5,
                },
                {
                  name: "Terminal",
                  type: "DOCK_ICON",
                  mode: "color",
                  tokenId: "black",
                  outlineMode: "color",
                  outlineTokenId: "latte-med",
                  order: 6,
                },
                {
                  name: "Settings",
                  type: "DOCK_ICON",
                  mode: "color",
                  tokenId: "black",
                  outlineMode: "color",
                  outlineTokenId: "latte-med",
                  order: 7,
                },
                {
                  name: "GitHub",
                  type: "DOCK_ICON",
                  mode: "color",
                  tokenId: "black",
                  outlineMode: "color",
                  outlineTokenId: "latte-med",
                  order: 8,
                },
                {
                  name: "Cursor",
                  type: "CURSOR",
                  mode: "color",
                  tokenId: "black",
                  outlineMode: "color",
                  outlineTokenId: "latte-outer",
                  order: 9,
                },
              ],
            },
          },
        },
      });

      // Create default DockConfig with stellar, flow, studio
      const dockConfig = await tx.dockConfig.create({
        data: {
          constellationId: constellation.id,
          items: {
            create: [
              {
                appId: "stellar",
                position: 0,
                // Optionally link to component
                flowComponentId: (
                  await tx.flowComponent.findFirst({
                    where: {
                      flowId: orionConfigFlow.id,
                      name: "Stellar",
                    },
                  })
                )?.id,
              },
              {
                appId: "flow",
                position: 1,
                flowComponentId: (
                  await tx.flowComponent.findFirst({
                    where: {
                      flowId: orionConfigFlow.id,
                      name: "Flow",
                    },
                  })
                )?.id,
              },
            ],
          },
        },
      });

      // 14. Create AppState in constellation for Orion
      await tx.appState.create({
        data: {
          appId: "orion",
          activeFlowId: orionConfigFlow.id,
          constellationId: constellation.id,
          stateData: {
            navState: "home",
            theme: "dark",
          },
        },
      });

      // 15. Create Window State for default window positions
      await tx.windowState.create({
        data: {
          appId: "finder",
          position: { x: 100, y: 100 },
          size: { width: 800, height: 600 },
          isMinimized: false,
          isMaximized: false,
          zIndex: 1,
          constellationId: constellation.id,
        },
      });

      return createdUser;
    });

    if (newUser) {
      return { status: 201, user: newUser };
    }

    return { status: 400 };
  } catch (error) {
    console.log("🔴 ERROR", error);
    return { status: 500 };
  }
};
