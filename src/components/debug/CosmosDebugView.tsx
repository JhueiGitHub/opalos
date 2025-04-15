// src/components/debug/CosmosDebugView.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCosmosHierarchy } from "@/actions/debug";
import {
  Tree,
  Folder,
  File,
  type TreeViewElement,
} from "@/components/magic/file-tree";
import { ReloadIcon } from "@radix-ui/react-icons";

export default function CosmosDebugView() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["cosmos-hierarchy"],
    queryFn: getCosmosHierarchy,
    // Don't refetch on window focus to prevent UI flashing
    refetchOnWindowFocus: false,
  });

  // Transform the user data into TreeViewElement format
  const transformDataToTree = (userData: any): TreeViewElement[] => {
    if (!userData || !userData.cosmos) return [];

    const result: TreeViewElement[] = [];

    // Map each cosmos as a top-level element
    userData.cosmos.forEach((cosmos: any) => {
      const cosmosNode: TreeViewElement = {
        id: `cosmos-${cosmos.id}`,
        name:
          cosmos.name +
          (cosmos.id === userData.activeCosmosId ? " (Active)" : ""),
        isSelectable: true,
        children: [],
      };

      // StellarDrives branch
      if (cosmos.stellarDrives?.length > 0) {
        const stellarNode: TreeViewElement = {
          id: `stellar-${cosmos.id}`,
          name: "StellarDrives",
          isSelectable: true,
          children: cosmos.stellarDrives.map((drive: any) => ({
            id: `drive-${drive.id}`,
            name: drive.name,
            isSelectable: true,
            children:
              drive.folders?.length > 0
                ? [
                    {
                      id: `folders-${drive.id}`,
                      name: "Folders",
                      isSelectable: true,
                      children: drive.folders.map((folder: any) => ({
                        id: `folder-${folder.id}`,
                        name:
                          folder.name +
                          (folder.inSidebar
                            ? ` (Sidebar: ${folder.sidebarOrder})`
                            : ""),
                        isSelectable: true,
                      })),
                    },
                  ]
                : [],
          })),
        };
        cosmosNode.children?.push(stellarNode);
      }

      // Constellations branch
      if (cosmos.constellations?.length > 0) {
        const constellationsNode: TreeViewElement = {
          id: `constellations-${cosmos.id}`,
          name: "Constellations",
          isSelectable: true,
          children: cosmos.constellations.map((constellation: any) => ({
            id: `constellation-${constellation.id}`,
            name: constellation.name,
            isSelectable: true,
            children: [
              ...(constellation.appStates?.length > 0
                ? [
                    {
                      id: `appstates-${constellation.id}`,
                      name: "App States",
                      isSelectable: true,
                      children: constellation.appStates.map((state: any) => ({
                        id: `appstate-${state.id}`,
                        name: `${state.appId}`,
                        isSelectable: true,
                      })),
                    },
                  ]
                : []),
              ...(constellation.windowStates?.length > 0
                ? [
                    {
                      id: `windowstates-${constellation.id}`,
                      name: "Window States",
                      isSelectable: true,
                      children: constellation.windowStates.map(
                        (state: any) => ({
                          id: `windowstate-${state.id}`,
                          name: state.appId,
                          isSelectable: true,
                        })
                      ),
                    },
                  ]
                : []),
            ],
          })),
        };
        cosmosNode.children?.push(constellationsNode);
      }

      // Auras branch with nested structure
      if (cosmos.auras?.length > 0) {
        const aurasNode: TreeViewElement = {
          id: `auras-${cosmos.id}`,
          name: "Auras",
          isSelectable: true,
          children: cosmos.auras.map((aura: any) => ({
            id: `aura-${aura.id}`,
            name: aura.name,
            isSelectable: true,
            children:
              aura.auroras?.length > 0
                ? aura.auroras.map((aurora: any) => ({
                    id: `aurora-${aurora.id}`,
                    name: aurora.name,
                    isSelectable: true,
                    children:
                      aurora.streams?.length > 0
                        ? aurora.streams.map((stream: any) => ({
                            id: `stream-${stream.id}`,
                            name: stream.name,
                            isSelectable: true,
                            children:
                              stream.flows?.length > 0
                                ? stream.flows.map((flow: any) => ({
                                    id: `flow-${flow.id}`,
                                    name: `${flow.name} (${flow.type})`,
                                    isSelectable: true,
                                    children:
                                      flow.components?.length > 0
                                        ? [
                                            {
                                              id: `components-${flow.id}`,
                                              name: "Components",
                                              isSelectable: true,
                                              children: flow.components.map(
                                                (comp: any) => ({
                                                  id: `component-${comp.id}`,
                                                  name: `${comp.name}: ${
                                                    comp.tokenId ||
                                                    comp.value ||
                                                    ""
                                                  }`,
                                                  isSelectable: true,
                                                })
                                              ),
                                            },
                                          ]
                                        : [],
                                  }))
                                : [],
                          }))
                        : [],
                  }))
                : [],
          })),
        };
        cosmosNode.children?.push(aurasNode);
      }

      result.push(cosmosNode);
    });

    return result;
  };

  // Process the data
  const treeData =
    data?.status === 200 && data.data ? transformDataToTree(data.data) : [];

  // Auto-expand all nodes on initial load
  if (treeData.length > 0 && expandedItems.length === 0) {
    const allIds: string[] = [];
    const collectIds = (elements: TreeViewElement[]) => {
      for (const el of elements) {
        allIds.push(el.id);
        if (el.children) {
          collectIds(el.children);
        }
      }
    };
    collectIds(treeData);
    setExpandedItems(allIds);
  }

  // Recursive function to render the tree
  const renderTree = (nodes: TreeViewElement[]) => {
    return nodes.map((node) => {
      if (node.children && node.children.length > 0) {
        return (
          <Folder key={node.id} element={node.name} value={node.id}>
            {renderTree(node.children)}
          </Folder>
        );
      } else {
        return (
          <File key={node.id} value={node.id}>
            <p>{node.name}</p>
          </File>
        );
      }
    });
  };

  return (
    <div className="absolute bottom-6 right-6 z-50 h-[80vh] w-[400px] rounded-lg border border-slate-600 bg-black/80 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-700 p-3">
        <h3 className="text-lg font-medium text-white">Cosmos Debug View</h3>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1 rounded bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-600"
        >
          <ReloadIcon className="h-3 w-3" /> Refresh
        </button>
      </div>

      <div className="h-[calc(80vh-56px)]">
        {isLoading && <p className="p-4 text-white">Loading hierarchy...</p>}
        {error && <p className="p-4 text-red-400">Failed to fetch data</p>}

        {!isLoading && !error && treeData.length === 0 && (
          <p className="p-4 text-white">No cosmos data found</p>
        )}

        {!isLoading && !error && treeData.length > 0 && (
          <Tree className="h-full p-2" initialExpandedItems={expandedItems}>
            {renderTree(treeData)}
          </Tree>
        )}
      </div>
    </div>
  );
}
