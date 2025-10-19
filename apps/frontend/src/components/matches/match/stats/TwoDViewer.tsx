"use client";

import { Viewer } from "@eggosystem/viewer";
import type { DemoData } from "@eggosystem/viewer";
import { X } from "lucide-react";

export const TwoDViewer = ({
  isModalOpen,
  setIsModalOpen,
  twoDViewerData
}: {
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  twoDViewerData: DemoData;
}) => {
  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Full-screen modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-white mb-0">
          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>

          {/* Viewer content */}
          <div className="w-full h-full">
            <Viewer demoData={twoDViewerData} />
          </div>
        </div>
      )}
    </>
  );
};
