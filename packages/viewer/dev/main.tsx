/// <reference types="vite/client" />
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Viewer } from "../src/index";
import type { DemoData } from "../src/types";

type TwoDViewerProcessingStatus = {
  matchGameId: number;
  map: string;
  status: "processing" | "pending" | "parsing" | "error" | "retry" | "failed";
  progress: number;
  createdAt: string;
  filePath: string;
  data: null;
};

type TwoDViewerReadyStatus = {
  matchGameId: number;
  map: string;
  status: "ready";
  progress: 100;
  createdAt: string;
  parsedAt: string;
  tickCount: number;
  filePath: string;
  data: DemoData;
};

type TwoDViewerReturnData = TwoDViewerProcessingStatus | TwoDViewerReadyStatus;

const API_BASE_URL =
  import.meta.env.VITE_VIEWER_API_URL || "http://localhost:3000";

async function fetchDemoData(
  matchGameId: number
): Promise<TwoDViewerReturnData> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/demos/game/${matchGameId}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch demo data: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

function DevApp() {
  const [matchGameId, setMatchGameId] = useState<string>("");
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [mapName, setMapName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  // Debug: Log environment variables
  console.log("Environment variables:", {
    VITE_VIEWER_API_URL: import.meta.env.VITE_VIEWER_API_URL,
    VITE_VIEWER_ASSETS_URL: import.meta.env.VITE_VIEWER_ASSETS_URL
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(matchGameId);

    if (isNaN(id)) {
      setError("Please enter a valid match game ID");
      return;
    }

    setLoading(true);
    setError(null);
    setDemoData(null);
    setMapName("");

    try {
      const result = await fetchDemoData(id);

      if (result.status === "ready") {
        setDemoData(result.data);
        setMapName(result.map);
        setStatus("Demo loaded successfully!");
      } else {
        setStatus(`Status: ${result.status} (${result.progress}%)`);

        // Poll for updates if still processing
        if (
          result.status === "processing" ||
          result.status === "pending" ||
          result.status === "parsing"
        ) {
          const pollInterval = setInterval(async () => {
            try {
              const updatedResult = await fetchDemoData(id);
              setStatus(
                `Status: ${updatedResult.status} (${updatedResult.progress}%)`
              );

              if (updatedResult.status === "ready") {
                setDemoData(updatedResult.data);
                setMapName(updatedResult.map);
                setStatus("Demo loaded successfully!");
                clearInterval(pollInterval);
                setLoading(false);
              } else if (
                updatedResult.status === "error" ||
                updatedResult.status === "failed"
              ) {
                setError(`Demo processing failed: ${updatedResult.status}`);
                clearInterval(pollInterval);
                setLoading(false);
              }
            } catch (err) {
              setError(
                `Error polling for updates: ${err instanceof Error ? err.message : "Unknown error"}`
              );
              clearInterval(pollInterval);
              setLoading(false);
            }
          }, 3000);
        } else {
          setError(`Demo processing failed: ${result.status}`);
          setLoading(false);
        }
      }
    } catch (err) {
      setError(
        `Error fetching demo data: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Load match game ID from URL params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get("matchGameId");
    if (idFromUrl) {
      setMatchGameId(idFromUrl);
    }
  }, []);

  if (demoData && mapName) {
    console.log("Rendering Viewer with:", { demoData, mapName });
    return (
      <div style={{ height: "100vh", width: "100vw" }}>
        <Viewer demoData={demoData} mapName={mapName} />
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)",
        padding: "20px",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          background: "#1a1a1a",
          padding: "40px",
          borderRadius: "12px",
          border: "1px solid #333",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          maxWidth: "500px",
          width: "100%"
        }}
      >
        <h1
          style={{
            margin: "0 0 20px 0",
            fontSize: "28px",
            fontWeight: "700",
            color: "#fff",
            textAlign: "center"
          }}
        >
          @eggosystem/viewer
        </h1>

        <div
          style={{
            background: "#2a2a2a",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "20px",
            fontSize: "12px",
            color: "#ccc"
          }}
        >
          <div>API URL: {import.meta.env.VITE_VIEWER_API_URL}</div>
          <div>Assets URL: {import.meta.env.VITE_VIEWER_ASSETS_URL}</div>
          <div>Map Name: {mapName || "Not set"}</div>
          <div>Demo Data: {demoData ? "Loaded" : "Not loaded"}</div>
        </div>

        <p
          style={{
            margin: "0 0 30px 0",
            fontSize: "16px",
            color: "#888",
            textAlign: "center",
            lineHeight: "1.5"
          }}
        >
          Enter a match game ID to load demo data for development
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#fff"
              }}
            >
              Match Game ID
            </label>
            <input
              type="number"
              value={matchGameId}
              onChange={(e) => setMatchGameId(e.target.value)}
              placeholder="Enter match game ID..."
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "16px",
                background: "#222",
                border: "1px solid #444",
                borderRadius: "6px",
                color: "#fff",
                outline: "none",
                boxSizing: "border-box",
                opacity: loading ? 0.6 : 1
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !matchGameId}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "16px",
              fontWeight: "600",
              background: loading ? "#444" : "#4a90e2",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: loading || !matchGameId ? 0.6 : 1
            }}
          >
            {loading ? "Loading..." : "Load Demo"}
          </button>
        </form>

        {status && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px 16px",
              background: "#2a2a2a",
              borderRadius: "6px",
              fontSize: "14px",
              color: "#4a90e2",
              textAlign: "center"
            }}
          >
            {status}
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px 16px",
              background: "#3a1a1a",
              borderRadius: "6px",
              fontSize: "14px",
              color: "#ff6b6b",
              textAlign: "center"
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            marginTop: "30px",
            padding: "16px",
            background: "#1a1a1a",
            borderRadius: "6px",
            border: "1px solid #333"
          }}
        >
          <h3
            style={{
              margin: "0 0 12px 0",
              fontSize: "14px",
              fontWeight: "600",
              color: "#fff"
            }}
          >
            API Configuration
          </h3>
          <p
            style={{
              margin: "0",
              fontSize: "12px",
              color: "#888",
              fontFamily: "monospace"
            }}
          >
            Base URL: {API_BASE_URL}
          </p>
          <p
            style={{
              margin: "8px 0 0 0",
              fontSize: "12px",
              color: "#888"
            }}
          >
            Set VITE_VIEWER_API_URL environment variable to change the API
            endpoint
          </p>
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<DevApp />);
}
