"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

// Define the context type
interface CommentsContextType {
  comments: { [key: number]: string };
  setCommentForTeam: (
    teamId: number,
    comment: string,
    autoSave?: boolean
  ) => void;
  initializeComments: (initialComments: { [key: number]: string }) => void;
  getAllComments: () => { [key: number]: string };
  registerSaveFunction: (saveFn: () => Promise<void>) => void;
}

// Create the context with a default value
const CommentsContext = createContext<CommentsContextType | undefined>(
  undefined
);

// Provider component
export function CommentsProvider({ children }: { children: React.ReactNode }) {
  const [comments, setComments] = useState<{ [key: number]: string }>({});
  const [saveFunction, setSaveFunction] = useState<
    (() => Promise<void>) | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);

  // Register a save function that will be called on autosave
  const registerSaveFunction = useCallback((saveFn: () => Promise<void>) => {
    setSaveFunction(() => saveFn);
  }, []);

  // Set a comment for a specific team
  const setCommentForTeam = useCallback(
    (teamId: number, comment: string, autoSave = true) => {
      // Always update the comment in context immediately
      setComments((prev) => {
        // If comment hasn't changed, don't trigger a re-render
        if (prev[teamId] === comment) {
          return prev;
        }

        return {
          ...prev,
          [teamId]: comment
        };
      });

      // Auto-save if enabled and we have a save function
      // But don't trigger auto-save for every keystroke
      if (autoSave && saveFunction && !isSaving) {
        setIsSaving(true);
        // Increased delay to reduce frequency of saves
        setTimeout(async () => {
          try {
            await saveFunction();
          } catch (error) {
            console.error("Error auto-saving comments:", error);
          } finally {
            setIsSaving(false);
          }
        }, 300); // Increased from 100ms to 300ms
      }
    },
    [saveFunction, isSaving]
  );

  // Initialize all comments (used when loading from API)
  const initializeComments = useCallback(
    (initialComments: { [key: number]: string }) => {
      setComments(initialComments);
    },
    []
  );

  // Get all comments (used when saving to API)
  const getAllComments = useCallback(() => {
    return comments;
  }, [comments]);

  return (
    <CommentsContext.Provider
      value={{
        comments,
        setCommentForTeam,
        initializeComments,
        getAllComments,
        registerSaveFunction
      }}
    >
      {children}
    </CommentsContext.Provider>
  );
}

// Custom hook to use the comments context
export function useComments() {
  const context = useContext(CommentsContext);
  if (context === undefined) {
    throw new Error("useComments must be used within a CommentsProvider");
  }
  return context;
}
