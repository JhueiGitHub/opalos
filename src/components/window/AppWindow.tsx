// src/components/window/AppWindow.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  useWindowStore,
  WindowPosition,
  WindowSize,
} from "@/store/windowStore";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion"; // For animations
import { useIsMobile } from "@/hooks/use-mobile";

interface AppWindowProps {
  appId: string;
  title: string;
}

export const AppWindow: React.FC<AppWindowProps> = ({ appId, title }) => {
  const {
    activeAppId,
    windowData,
    setActiveApp,
    closeApp,
    minimizeApp,
    maximizeApp,
    restoreApp,
    moveWindow,
    resizeWindow,
    currentWorkspace,
  } = useWindowStore();

  const isMobile = useIsMobile();
  const windowRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Get window data
  const window = windowData[appId];
  if (!window) return null;

  // Check if window should be visible
  const isActive = activeAppId === appId;
  const isVisible =
    !window.isMinimized && window.workspace === currentWorkspace;

  // Function to start dragging
  const startDrag = (e: React.MouseEvent) => {
    if (window.isMaximized) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startPosition = { ...window.position };

    setIsDragging(true);

    const doDrag = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      moveWindow(appId, {
        x: startPosition.x + deltaX,
        y: startPosition.y + deltaY,
      });
    };

    const stopDrag = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  // Function to start resizing
  const startResize = (e: React.MouseEvent) => {
    if (window.isMaximized) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = { ...window.size };

    setIsResizing(true);

    const doResize = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      // Ensure minimum size
      const newWidth = Math.max(startSize.width + deltaX, 300);
      const newHeight = Math.max(startSize.height + deltaY, 200);

      resizeWindow(appId, { width: newWidth, height: newHeight });
    };

    const stopResize = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", doResize);
      document.removeEventListener("mouseup", stopResize);
    };

    document.addEventListener("mousemove", doResize);
    document.addEventListener("mouseup", stopResize);
  };

  // Dynamically import the app component
  const AppContent = dynamic(() => import(`@/app/apps/${appId}/App`), {
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">Loading...</div>
      </div>
    ),
    ssr: false,
  });

  if (!isVisible) return null;

  // Modify the getWindowStyle function
  const getWindowStyle = (): React.CSSProperties => {
    if (window.isMaximized) {
      return {
        position: "absolute" as const,
        top: 0,
        left: 0,
        width: "100%",
        height: "calc(100% - 80px)", // Account for dock
        transform: "none",
      };
    }

    return {
      position: "absolute" as const,
      top: window.position.y,
      left: window.position.x,
      width: window.size.width,
      height: window.size.height,
      zIndex: window.zIndex,
    };
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={windowRef}
        className={`absolute rounded-lg overflow-hidden 
                   bg-black bg-opacity-30 backdrop-filter backdrop-blur-md 
                   border border-white border-opacity-10 shadow-xl`}
        style={getWindowStyle()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 25,
          },
        }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={() => setActiveApp(appId)}
        whileHover={{ boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)" }}
      >
        {/* Window title bar */}
        <div
          ref={dragRef}
          className={`flex items-center justify-between px-4 py-2 bg-black bg-opacity-40 cursor-move
                     ${isActive ? "bg-opacity-60" : "bg-opacity-40"}`}
          onMouseDown={startDrag}
        >
          <div className="flex space-x-2">
            <button
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                closeApp(appId);
              }}
            />
            <button
              className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                minimizeApp(appId);
              }}
            />
            <button
              className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                window.isMaximized ? restoreApp(appId) : maximizeApp(appId);
              }}
            />
          </div>
          <div
            className={`text-white text-sm font-medium ${
              isActive ? "opacity-100" : "opacity-70"
            }`}
          >
            {title}
          </div>
          <div className="w-16" />
        </div>

        {/* App content */}
        <div className="h-[calc(100%-40px)] overflow-auto">
          <AppContent />
        </div>

        {/* Resize handle - only visible when not maximized */}
        {!window.isMaximized && (
          <div
            className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
            onMouseDown={startResize}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              className="absolute bottom-1 right-1 fill-white opacity-50"
            >
              <path d="M0,10 L10,0 L10,10 Z" />
            </svg>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
