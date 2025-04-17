"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IconPlanet,
  IconChevronDown,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import {
  getUserCosmos,
  setActiveCosmos,
  deleteCosmos,
  CosmosInfo,
} from "@/actions/cosmos";
import { cn } from "@/lib/utils";
import { CreateCosmosModal } from "./CreateCosmosModal";
import { toast } from "sonner";

export const MenuBar: React.FC = () => {
  const [isCosmosOpen, setIsCosmosOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch cosmos data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["user-cosmos"],
    queryFn: getUserCosmos,
  });

  const cosmosData = data?.data || [];
  const activeCosmos = cosmosData.find((cosmos) => cosmos.isActive);

  // Handle setting active cosmos
  const handleSetActiveCosmos = async (cosmosId: string) => {
    const result = await setActiveCosmos(cosmosId);
    if (result.status === 200) {
      // Close dropdown
      setIsCosmosOpen(false);
      toast.success("Cosmos activated successfully");

      // Force a page reload to reset all application state
      window.location.reload();
    } else {
      toast.error("Failed to activate cosmos");
    }
  };

  // Handle cosmos deletion
  const handleDeleteCosmos = async (cosmosId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent button

    if (
      window.confirm(
        "Are you sure you want to delete this cosmos? This action cannot be undone."
      )
    ) {
      const result = await deleteCosmos(cosmosId);

      if (result.status === 200) {
        refetch();
        toast.success("Cosmos deleted successfully");
      } else if (result.status === 400) {
        toast.error(
          "Cannot delete active cosmos. Switch to another cosmos first."
        );
      } else {
        toast.error("Failed to delete cosmos");
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsCosmosOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-8 bg-black bg-opacity-30 backdrop-filter backdrop-blur-md border-b border-white border-opacity-10 flex items-center px-3 z-50">
        {/* App logo/name */}
        <div className="mr-4 text-white font-semibold">Orion</div>

        {/* Cosmos dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-1 px-2 py-1 text-white rounded-md hover:bg-white hover:bg-opacity-10"
            onClick={() => setIsCosmosOpen(!isCosmosOpen)}
          >
            <IconPlanet size={14} />
            <span className="text-sm">
              {isLoading ? "Loading..." : activeCosmos?.name || "Select Cosmos"}
            </span>
            <IconChevronDown
              size={14}
              className={cn(
                "transition-transform",
                isCosmosOpen && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown menu */}
          {isCosmosOpen && (
            <div className="absolute top-full left-0 mt-1 w-60 bg-black bg-opacity-80 backdrop-filter backdrop-blur-md rounded-md border border-white border-opacity-10 shadow-lg overflow-hidden z-50">
              <div className="py-1">
                {cosmosData.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-white text-opacity-70">
                    No cosmos found
                  </div>
                ) : (
                  cosmosData.map((cosmos) => (
                    <div key={cosmos.id} className="group flex items-center">
                      <button
                        className={cn(
                          "flex-grow text-left px-3 py-2 text-sm hover:bg-white hover:bg-opacity-10",
                          cosmos.isActive
                            ? "text-white bg-white bg-opacity-10"
                            : "text-white text-opacity-80"
                        )}
                        onClick={() => handleSetActiveCosmos(cosmos.id)}
                      >
                        {cosmos.name}
                        {cosmos.isActive && (
                          <span className="ml-2 text-xs opacity-70">
                            (Active)
                          </span>
                        )}
                      </button>

                      {/* Delete button - only for non-active cosmos */}
                      {!cosmos.isActive && (
                        <button
                          className="px-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteCosmos(cosmos.id, e)}
                          title="Delete Cosmos"
                        >
                          <IconTrash size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-white border-opacity-10">
                <button
                  className="w-full flex items-center gap-1 px-3 py-2 text-sm text-white hover:bg-white hover:bg-opacity-10"
                  onClick={() => {
                    setIsCreateModalOpen(true);
                    setIsCosmosOpen(false);
                  }}
                >
                  <IconPlus size={14} />
                  Create New Cosmos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Cosmos Modal */}
      <CreateCosmosModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
          toast.success("Cosmos created successfully");
        }}
      />
    </>
  );
};
