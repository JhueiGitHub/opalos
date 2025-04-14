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
import Image from "next/image";

type Props = {};

const Desktop = (props: Props) => {
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
    <div className="w-full h-full bg-black flex items-center justify-center text-[#4C4F69]">
      <span>Desktop</span>
      <div className="absolute bottom-[9px]">
        <FloatingDock items={links} />
      </div>
    </div>
  );
};

export default Desktop;
