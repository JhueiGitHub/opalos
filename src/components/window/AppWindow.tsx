// src/components/window/AppWindow.tsx
"use client";

import React from "react";
import { useWindowStore } from "@/store/windowStore";
import dynamic from "next/dynamic";

interface AppWindowProps {
  appId: string;
  title: string;
}

export const AppWindow: React.FC<AppWindowProps> = ({ appId, title }) => {
  const { activeAppId, closeApp, minimizeApp } = useWindowStore();
  const isActive = activeAppId === appId;

  // Dynamically import the app component
  const AppContent = dynamic(() => import(`@/app/apps/${appId}/App`), {
    loading: () => (
      <div className="flex items-center justify-center h-full">Loading...</div>
    ),
    ssr: false,
  });

  return (
    <div
      className={`w-full h-full rounded-lg overflow-hidden 
                 bg-black bg-opacity-30 backdrop-filter backdrop-blur-md 
                 border border-white border-opacity-10 
                 ${isActive ? "z-20" : "z-10"}`}
      onClick={() => useWindowStore.getState().setActiveApp(appId)}
    >
      {/* Window title bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black bg-opacity-40">
        <div className="flex space-x-2">
          <button
            className="w-3 h-3 rounded-full bg-red-500"
            onClick={(e) => {
              e.stopPropagation();
              closeApp(appId);
            }}
          />
          <button
            className="w-3 h-3 rounded-full bg-yellow-500"
            onClick={(e) => {
              e.stopPropagation();
              minimizeApp(appId);
            }}
          />
          <div className="w-3 h-3 rounded-full bg-green-500 opacity-50" />
        </div>
        <div className="text-white text-sm font-medium">{title}</div>
        <div className="w-16" />
      </div>

      {/* App content */}
      <div className="h-[calc(100%-40px)] overflow-auto p-4">
        <AppContent />
      </div>
    </div>
  );
};
