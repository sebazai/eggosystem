#!/usr/bin/env node

/**
 * Test script to enqueue a welcome email to the BullMQ queue
 *
 * Usage:
 *   pnpm --filter=backend test:email-queue
 *   or
 *   cd apps/backend && pnpm test:email-queue
 */

import dotenv from "dotenv";

// Load environment variables
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
  dotenv.config({ path: [".env.development", ".env"], quiet: true });
}

import {
  enqueueSeasonWelcomeEmail,
  getEmailQueueStats,
  closeEmailQueue
} from "../src/services/email-queue.services";
import { logger } from "../src/utils/app-logger";

const TEST_EMAIL = "test@gmaili.com";
const TEST_ACCOUNT_ID = 2925; // Fake account ID for testing

async function testEmailQueue() {
  try {
    logger.info("Starting email queue test...");

    // Create test job data with fake/placeholder values
    const testJobData = {
      to: TEST_EMAIL,
      accountId: TEST_ACCOUNT_ID,
      seasonDisplayName: "Test Season 2024 - CS2",
      seasonStartDate: "January 15, 2024",
      teamName: "Test Team Alpha",
      leagueName: "Masters League",
      platform: "Kanaliiga",
      rulebookUrl: "https://kanaliiga.fi/rules",
      discordLink: "https://discord.gg/test",
      mapNames: ["Dust2", "Mirage", "Inferno", "Nuke", "Overpass"],
      seasonId: 999, // Fake season ID for testing
      playerEmail: TEST_EMAIL,
      playerNickname: "TestPlayer"
    };

    logger.info("Enqueueing test welcome email...");
    logger.info(`Email: ${TEST_EMAIL}`);
    logger.info(`Season: ${testJobData.seasonDisplayName}`);
    logger.info(`Team: ${testJobData.teamName}`);

    // Enqueue the email
    await enqueueSeasonWelcomeEmail(testJobData);

    logger.info("✅ Test email successfully enqueued!");

    // Get queue stats
    const stats = await getEmailQueueStats();
    logger.info("📊 Current queue statistics:");
    logger.info(`   Waiting: ${stats.waiting}`);
    logger.info(`   Active: ${stats.active}`);
    logger.info(`   Delayed: ${stats.delayed}`);
    logger.info(`   Completed: ${stats.completed}`);
    logger.info(`   Failed: ${stats.failed}`);
    logger.info(`   Total: ${stats.total}`);

    logger.info("");
    logger.info("💡 The email worker should process this job automatically.");
    logger.info("💡 Check the logs to see when the email is sent.");
    logger.info(
      "💡 You can also check the BullMQ Monitor at http://localhost:3010"
    );

    // Close the queue connection
    await closeEmailQueue();

    // Exit successfully
    process.exit(0);
  } catch (error) {
    logger.error("❌ Failed to enqueue test email:", error);

    // Try to close the queue connection even on error
    try {
      await closeEmailQueue();
    } catch (closeError) {
      logger.error("Failed to close queue connection:", closeError);
    }

    process.exit(1);
  }
}

// Run the test
void testEmailQueue();
