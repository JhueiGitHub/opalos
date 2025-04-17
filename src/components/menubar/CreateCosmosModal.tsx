"use client";

import React, { useState } from "react";
import { createCosmos } from "@/actions/cosmos";
import { IconX } from "@tabler/icons-react";

interface CreateCosmosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCosmosModal: React.FC<CreateCosmosModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Cosmos name is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await createCosmos(name, description);

      if (result.status === 201) {
        setName("");
        setDescription("");
        onSuccess();
        onClose();
      } else {
        setError("Failed to create cosmos. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-black bg-opacity-80 backdrop-filter backdrop-blur-md rounded-lg border border-white border-opacity-10 p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">
            Create New Cosmos
          </h3>
          <button
            onClick={onClose}
            className="text-white text-opacity-70 hover:text-opacity-100"
          >
            <IconX size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white text-opacity-90 text-sm mb-1">
              Cosmos Name*
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded px-3 py-2 text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:border-white focus:border-opacity-50"
              placeholder="Enter cosmos name"
            />
          </div>

          <div className="mb-6">
            <label className="block text-white text-opacity-90 text-sm mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded px-3 py-2 text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:border-white focus:border-opacity-50"
              placeholder="Enter description"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white text-opacity-70 hover:text-opacity-100 mr-2"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 text-white border border-white border-opacity-30 rounded"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Cosmos"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
