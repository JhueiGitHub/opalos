// src/app/components/Desktop.tsx
"use client";

import React, { useEffect, useState } from "react";
import { FloatingDock } from "@/components/ace/floating-dock";
import { getActiveDockItems, DockItem } from "@/actions/dock";
import { useWindowStore } from "@/store/windowStore";
import { AppWindow } from "@/components/window/AppWindow";
import {
  IconFolder,
  IconPalette,
  IconVideo,
  IconTerminal2,
  IconSettings,
  IconBrandGithub,
  IconBrandDiscord,
  IconBrandX,
  IconLayoutGrid,
  IconLayoutColumns,
} from "@tabler/icons-react";
import { useWindowShortcuts } from "@/hooks/use-window-shortcuts";
import { MenuBar } from "@/components/menubar/MenuBar";

// Type-safe icon mapping
const ICON_MAP: Record<string, React.ReactNode> = {
  IconFolder: (
    <IconFolder className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
  ),
  IconPalette: (
    <IconPalette className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
  ),
  // ... other icons
};

// App name mapping
const APP_TO_COMPONENT_MAP: Record<string, string> = {
  stellar: "Stellar",
  flow: "Flow",
  // ... other apps
};

// App title mapping
const APP_TITLES: Record<string, string> = {
  stellar: "Stellar File Manager",
  flow: "Flow Design System",
  // ... other app titles
};

interface DesktopProps {
  iconStyles?: Array<{
    name: string;
    color: string;
    colorOpacity: number;
    outlineColor: string;
    outlineOpacity: number;
  }>;
}

const Desktop: React.FC<DesktopProps> = ({ iconStyles = [] }) => {
  const [dockItems, setDockItems] = useState<DockItem[]>([]);
  const {
    openApps,
    openApp,
    windowData,
    initialize,
    tileWindows,
    cascadeWindows,
    currentWorkspace,
    workspaces,
    switchWorkspace,
    isInitialized,
  } = useWindowStore();

  useWindowShortcuts();

  useEffect(() => {
    // Initialize window states from database
    initialize();

    // Load dock items
    async function loadDockItems() {
      const result = await getActiveDockItems();
      if (result.status === 200) {
        setDockItems(result.data);
      }
    }
    loadDockItems();
  }, []);

  // Create links for FloatingDock with click handlers
  const links = [
    ...dockItems.map((item) => {
      // Icon and style mapping
      const iconKey = item.app.icon;
      const icon =
        iconKey in ICON_MAP ? ICON_MAP[iconKey] : ICON_MAP["IconFolder"];
      const componentName = APP_TO_COMPONENT_MAP[item.appId] || item.appId;
      const style =
        iconStyles.find((s) => s.name === componentName) || item.style || {};

      return {
        title: item.app.name,
        icon: icon,
        href: "#",
        style: style,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          openApp(item.appId);
        },
      };
    }),
    // Add window management buttons
    {
      title: "Tile Windows",
      icon: (
        <IconLayoutGrid className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
      ),
      href: "#",
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        tileWindows();
      },
    },
    {
      title: "Cascade Windows",
      icon: (
        <IconLayoutColumns className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
      ),
      href: "#",
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        cascadeWindows();
      },
    },
  ];

  // Workspace selector
  const renderWorkspaceSelector = () => {
    if (workspaces.length <= 1) return null;

    return (
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-20 rounded-full px-4 py-1 backdrop-blur-md">
        {workspaces.map((workspace) => (
          <button
            key={workspace}
            onClick={() => switchWorkspace(workspace)}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
              workspace === currentWorkspace
                ? "bg-white bg-opacity-20 text-white"
                : "text-white text-opacity-60 hover:text-opacity-100"
            }`}
          >
            {workspace}
          </button>
        ))}
      </div>
    );
  };

  if (!isInitialized) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Menu bar */}
      <MenuBar />

      {/* Workspace selector - adjusted position for menu bar */}
      {renderWorkspaceSelector()}

      {/* Render open app windows */}
      {openApps.map((appId) => (
        <AppWindow
          key={appId}
          appId={appId}
          title={APP_TITLES[appId] || appId}
        />
      ))}

      <div className="absolute bottom-[9px] z-[1000]">
        <FloatingDock items={links} />
      </div>
    </div>
  );
};

export default Desktop;
