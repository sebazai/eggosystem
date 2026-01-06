"use client";

import { Viewer } from "@eggosystem/viewer";
import { X } from "lucide-react";
import { use2DViewerData } from "@/hooks/data/use2DViewerData";
import { Spinner } from "@/components/ui/spinner";

export const TwoDViewer = ({
  matchGameId,
  isModalOpen,
  setIsModalOpen
}: {
  matchGameId: number;
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
}) => {
  // Only fetch the 25MB data when modal is open
  const { twoDViewerData, isLoading, isError } = use2DViewerData(
    isModalOpen ? matchGameId : null
  );

  const closeModal = () => {
    setIsModalOpen(false);
  };

  if (!isModalOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-white mb-0">
      {/* Close button */}
      <button
        onClick={closeModal}
        className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        aria-label="Close modal"
      >
        <X className="h-6 w-6 text-gray-600" />
      </button>

      {/* Content */}
      <div className="w-full h-full flex items-center justify-center">
        {isLoading && (
          <div className="flex flex-col items-center gap-4 text-kanaliiga-orange">
            <Spinner size="lg" />
            <p className="text-lg">Loading 2D Viewer data...</p>
          </div>
        )}

        {isError && (
          <div className="text-center">
            <p className="text-lg text-red-600">
              Failed to load 2D viewer data
            </p>
            <button
              onClick={closeModal}
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        )}

        {!isLoading && !isError && twoDViewerData?.status === "ready" && (
          <Viewer demoData={twoDViewerData.data} mapName={twoDViewerData.map} />
        )}

        {!isLoading &&
          !isError &&
          twoDViewerData &&
          twoDViewerData.status !== "ready" && (
            <div className="text-center">
              <p className="text-lg">
                2D Viewer data is being processed. Please try again later.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Status: {twoDViewerData.status} ({twoDViewerData.progress}%)
              </p>
              <button
                onClick={closeModal}
                className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          )}
      </div>
    </div>
  );
};
