// src/components/Desktop.tsx
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

const Desktop = () => {
  const links = [
    {
      title: "Home",
      icon: (
        <IconHome className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
      ),
      href: "#",
    },

    {
      title: "Products",
      icon: (
        <IconTerminal2 className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Components",
      icon: (
        <IconNewSection className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
      ),
      href: "#",
    },

    {
      title: "Changelog",
      icon: (
        <IconExchange className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
      ),
      href: "#",
    },

    {
      title: "Twitter",
      icon: (
        <IconBrandX className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "GitHub",
      icon: (
        <IconBrandGithub className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Aceternity UI",
      icon: (
        <IconDeviceDesktop className="h-full w-full text-[#4C4F69] dark:text-neutral-300" />
      ),
      href: "#",
    },
  ];
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-[#4C4F69]">Desktop</span>

      <div className="absolute bottom-[9px]">
        <FloatingDock items={links} />
      </div>

      {/* Debug panel */}
      <CosmosDebugView />
    </div>
  );
};

export default Desktop;
