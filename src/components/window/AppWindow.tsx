// src/components/window/AppWindow.tsx
"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  useWindowStore,
  WindowPosition,
  WindowSize,
  LAYOUTS,
} from "@/store/windowStore";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconChevronDown,
  IconCornerUpLeft,
  IconCornerUpRight,
  IconCornerDownLeft,
  IconCornerDownRight,
  IconMaximize,
  IconMinimize,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

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
    // New snap actions
    snapWindowLeft,
    snapWindowRight,
    snapWindowTop,
    snapWindowBottom,
    snapWindowTopLeft,
    snapWindowTopRight,
    snapWindowBottomLeft,
    snapWindowBottomRight,
  } = useWindowStore();

  const isMobile = useIsMobile();
  const windowRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showSnapControls, setShowSnapControls] = useState(false);

  // Get window data
  const window = windowData[appId];
  if (!window) return null;

  // Check if window should be visible
  const isActive = activeAppId === appId;
  const isVisible =
    !window.isMinimized && window.workspace === currentWorkspace;

  // Function to start dragging (unchanged)
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

  // Function to start resizing (unchanged)
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

  // Create layout transition variants for smooth animations
  const layoutVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
    exit: { scale: 0.9, opacity: 0 },
  };

  // Determine window style based on state
  const getWindowStyle = (): React.CSSProperties => {
    if (window.isMaximized) {
      return {
        position: "absolute" as const,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%", // Account for dock
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

  // Get classes for highlight buttons based on current layout
  const getSnapButtonClass = (layout: string) => {
    return cn(
      "w-6 h-6 flex items-center justify-center rounded-full transition-colors",
      window.layout === layout
        ? "bg-white bg-opacity-40 text-white"
        : "text-white text-opacity-60 hover:text-opacity-100 hover:bg-white hover:bg-opacity-10"
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={windowRef}
        className={`absolute rounded-lg overflow-hidden 
                   bg-black bg-opacity-30 backdrop-filter backdrop-blur-md 
                   border border-white border-opacity-10 shadow-xl`}
        style={getWindowStyle()}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={layoutVariants}
        onClick={() => setActiveApp(appId)}
        whileHover={{ boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)" }}
        onMouseEnter={() => setShowSnapControls(true)}
        onMouseLeave={() => setShowSnapControls(false)}
        layoutId={`window-${appId}`}
      >
        {/* Window title bar */}
        <div
          ref={dragRef}
          className={`flex items-center justify-between px-4 py-2 bg-black cursor-move
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

          {/* Snap controls - fade in when window is hovered */}
          <AnimatePresence>
            {showSnapControls && (
              <motion.div
                className="flex space-x-1"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  className={getSnapButtonClass(LAYOUTS.SNAP_LEFT)}
                  onClick={(e) => {
                    e.stopPropagation();
                    snapWindowLeft(appId);
                  }}
                  title="Snap to left half"
                >
                  <IconChevronLeft size={14} />
                </button>
                <button
                  className={getSnapButtonClass(LAYOUTS.SNAP_RIGHT)}
                  onClick={(e) => {
                    e.stopPropagation();
                    snapWindowRight(appId);
                  }}
                  title="Snap to right half"
                >
                  <IconChevronRight size={14} />
                </button>
                <button
                  className={getSnapButtonClass(LAYOUTS.SNAP_TOP)}
                  onClick={(e) => {
                    e.stopPropagation();
                    snapWindowTop(appId);
                  }}
                  title="Snap to top half"
                >
                  <IconChevronUp size={14} />
                </button>
                <button
                  className={getSnapButtonClass(LAYOUTS.SNAP_BOTTOM)}
                  onClick={(e) => {
                    e.stopPropagation();
                    snapWindowBottom(appId);
                  }}
                  title="Snap to bottom half"
                >
                  <IconChevronDown size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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

        {/* Enhanced snap controls that appear in corners when window is hovered */}
        <AnimatePresence>
          {showSnapControls && !window.isMaximized && (
            <>
              {/* Corner buttons */}
              <motion.button
                className="absolute top-12 left-2 w-8 h-8 rounded-full bg-black bg-opacity-30 
                           flex items-center justify-center text-white opacity-70 hover:opacity-100"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 0.7, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  snapWindowTopLeft(appId);
                }}
                title="Snap to top-left corner"
              >
                <IconCornerUpLeft size={16} />
              </motion.button>

              <motion.button
                className="absolute top-12 right-2 w-8 h-8 rounded-full bg-black bg-opacity-30 
                           flex items-center justify-center text-white opacity-70 hover:opacity-100"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 0.7, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  snapWindowTopRight(appId);
                }}
                title="Snap to top-right corner"
              >
                <IconCornerUpRight size={16} />
              </motion.button>

              <motion.button
                className="absolute bottom-12 left-2 w-8 h-8 rounded-full bg-black bg-opacity-30 
                           flex items-center justify-center text-white opacity-70 hover:opacity-100"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.7, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  snapWindowBottomLeft(appId);
                }}
                title="Snap to bottom-left corner"
              >
                <IconCornerDownLeft size={16} />
              </motion.button>

              <motion.button
                className="absolute bottom-12 right-2 w-8 h-8 rounded-full bg-black bg-opacity-30 
                           flex items-center justify-center text-white opacity-70 hover:opacity-100"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.7, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  snapWindowBottomRight(appId);
                }}
                title="Snap to bottom-right corner"
              >
                <IconCornerDownRight size={16} />
              </motion.button>

              {/* Center button for maximize/restore */}
              <motion.button
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                           w-10 h-10 rounded-full bg-black bg-opacity-50 
                           flex items-center justify-center text-white opacity-70 hover:opacity-100"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.8, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.isMaximized ? restoreApp(appId) : maximizeApp(appId);
                }}
                title={
                  window.isMaximized ? "Restore window" : "Maximize window"
                }
              >
                {window.isMaximized ? (
                  <IconMinimize size={20} />
                ) : (
                  <IconMaximize size={20} />
                )}
              </motion.button>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
