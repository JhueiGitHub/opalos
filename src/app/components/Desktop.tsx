// src/app/components/Desktop.tsx
"use client";

import React from "react";
import { FloatingDock } from "@/components/ace/floating-dock";
import {
  IconBrandGithub,
  IconBrandX,
  IconExchange,
  IconHome,
  IconNewSection,
  IconDeviceDesktop,
  IconTerminal2,
} from "@tabler/icons-react";
import CosmosDebugView from "@/components/debug/CosmosDebugView";

// Define the shape of an icon style
interface IconStyle {
  name: string;
  color: string;
  colorOpacity: number;
  outlineColor: string;
  outlineOpacity: number;
}

// Define the props interface
interface DesktopProps {
  iconStyles?: IconStyle[];
}

const Desktop: React.FC<DesktopProps> = ({ iconStyles = [] }) => {
  // Type-safe keys for our iconMap
  type IconKey =
    | "Home"
    | "Products"
    | "Components"
    | "Changelog"
    | "Twitter"
    | "GitHub"
    | "Aceternity UI";

  // Map the icon configurations to match our links
  const iconMap: Record<IconKey, string> = {
    Home: "Finder",
    Products: "Terminal",
    Components: "Flow",
    Changelog: "Discord",
    Twitter: "Anki",
    GitHub: "GitHub",
    "Aceternity UI": "Stellar",
  };

  // Create links with their associated styles
  const links = [
    {
      title: "Home" as IconKey,
      icon: (
        <IconHome className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
      ),
      href: "#",
    },
    // Keep all other icons with the as IconKey cast...
    {
      title: "Products" as IconKey,
      icon: (
        <IconTerminal2 className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Components" as IconKey,
      icon: (
        <IconNewSection className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Changelog" as IconKey,
      icon: (
        <IconExchange className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Twitter" as IconKey,
      icon: (
        <IconBrandX className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "GitHub" as IconKey,
      icon: (
        <IconBrandGithub className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Aceternity UI" as IconKey,
      icon: (
        <IconDeviceDesktop className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
      ),
      href: "#",
    },
  ].map((link) => {
    // Find matching style by name
    const style = iconStyles.find((s) => s.name === iconMap[link.title]) || {};
    return {
      ...link,
      style, // Pass style to the link
    };
  });

  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-[#4C4F69]">Desktop</span>

      <div className="absolute bottom-[9px]">
        <FloatingDock items={links} />
      </div>

      <CosmosDebugView />
    </div>
  );
};

export default Desktop;
