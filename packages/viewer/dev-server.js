#!/usr/bin/env node

const { spawn } = require("child_process");
const readline = require("readline");
const path = require("path");

// Load environment variables from .env.development
require("dotenv").config({ path: path.join(__dirname, ".env.development") });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("🎮 @eggosystem/viewer Development Server");
  console.log("=====================================\n");

  const matchGameId = await askQuestion(
    "Enter match game ID (or press Enter to skip): "
  );

  rl.close();

  // Set environment variables
  const env = {
    ...process.env,
    VITE_VIEWER_API_URL:
      process.env.VITE_VIEWER_API_URL || "http://localhost:3000"
  };

  if (matchGameId) {
    env.VITE_MATCH_GAME_ID = matchGameId;
    console.log(`\n🚀 Starting dev server with match game ID: ${matchGameId}`);
    console.log(`📡 API URL: ${env.VITE_VIEWER_API_URL}`);
  } else {
    console.log("\n🚀 Starting dev server (no match game ID specified)");
    console.log(`📡 API URL: ${env.VITE_VIEWER_API_URL}`);
  }

  console.log("\n💡 You can also pass the match game ID via URL parameter:");
  console.log(
    `   http://localhost:3001?matchGameId=${matchGameId || "YOUR_ID"}\n`
  );

  // Start Vite dev server
  const viteProcess = spawn("npx", ["vite"], {
    env,
    stdio: "inherit",
    shell: true
  });

  viteProcess.on("close", (code) => {
    console.log(`\n👋 Dev server exited with code ${code}`);
  });

  viteProcess.on("error", (error) => {
    console.error("❌ Failed to start dev server:", error.message);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down dev server...");
    viteProcess.kill("SIGINT");
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Shutting down dev server...");
    viteProcess.kill("SIGTERM");
  });
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
