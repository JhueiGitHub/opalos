// src/hooks/use-window-shortcuts.tsx
import { useEffect } from "react";
import { useWindowStore } from "@/store/windowStore";

export const useWindowShortcuts = () => {
  const {
    activeAppId,
    maximizeApp,
    restoreApp,
    minimizeApp,
    closeApp,
    snapWindowLeft,
    snapWindowRight,
    snapWindowTop,
    snapWindowBottom,
    windowData,
  } = useWindowStore();

  useEffect(() => {
    if (!activeAppId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond if there's an active window
      if (!activeAppId) return;

      // Don't capture shortcuts when in a text input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Handle various window shortcuts
      // Win + Left Arrow = Snap Left
      if (e.metaKey && e.key === "ArrowLeft") {
        e.preventDefault();
        snapWindowLeft(activeAppId);
      }

      // Win + Right Arrow = Snap Right
      if (e.metaKey && e.key === "ArrowRight") {
        e.preventDefault();
        snapWindowRight(activeAppId);
      }

      // Win + Up Arrow = Maximize or Snap Top
      if (e.metaKey && e.key === "ArrowUp") {
        e.preventDefault();
        if (e.shiftKey) {
          snapWindowTop(activeAppId);
        } else {
          if (windowData[activeAppId]?.isMaximized) {
            restoreApp(activeAppId);
          } else {
            maximizeApp(activeAppId);
          }
        }
      }

      // Win + Down Arrow = Minimize or Snap Bottom
      if (e.metaKey && e.key === "ArrowDown") {
        e.preventDefault();
        if (e.shiftKey) {
          snapWindowBottom(activeAppId);
        } else {
          minimizeApp(activeAppId);
        }
      }

      // Win + W = Close Window
      if (e.metaKey && e.key === "w") {
        e.preventDefault();
        closeApp(activeAppId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeAppId, windowData]);

  return null;
};
