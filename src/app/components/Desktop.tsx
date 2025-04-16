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
} from "@tabler/icons-react";
import CosmosDebugView from "@/components/debug/CosmosDebugView";

// Type-safe icon mapping
const ICON_MAP: Record<string, React.ReactNode> = {
  IconFolder: (
    <IconFolder className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
  ),
  IconPalette: (
    <IconPalette className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
  ),
  IconVideo: (
    <IconVideo className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
  ),
  IconTerminal2: (
    <IconTerminal2 className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
  ),
  IconSettings: (
    <IconSettings className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
  ),
  IconBrandGithub: (
    <IconBrandGithub className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
  ),
  IconBrandDiscord: (
    <IconBrandDiscord className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
  ),
  IconBrandX: (
    <IconBrandX className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
  ),
};

// App name mapping
const APP_TO_COMPONENT_MAP: Record<string, string> = {
  stellar: "Stellar",
  flow: "Flow",
  studio: "Studio",
  terminal: "Terminal",
  github: "GitHub",
  settings: "Settings",
  finder: "Finder",
  discord: "Discord",
  anki: "Anki",
};

// App title mapping
const APP_TITLES: Record<string, string> = {
  stellar: "Stellar File Manager",
  flow: "Flow Design System",
  studio: "Studio",
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
  const { openApps, openApp, minimizedApps } = useWindowStore();

  useEffect(() => {
    async function loadDockItems() {
      const result = await getActiveDockItems();
      if (result.status === 200) {
        setDockItems(result.data);
      }
    }
    loadDockItems();
  }, []);

  // Create links for FloatingDock with click handlers
  const links = dockItems.map((item) => {
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
  });

  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Render open app windows */}
      {openApps
        .filter((appId) => !minimizedApps.includes(appId))
        .map((appId) => (
          <AppWindow
            key={appId}
            appId={appId}
            title={APP_TITLES[appId] || appId}
          />
        ))}

      <span className="text-[#4C4F69]">Desktop</span>

      <div className="absolute bottom-[9px]">
        <FloatingDock items={links} />
      </div>

      <CosmosDebugView />
    </div>
  );
};

export default Desktop;
