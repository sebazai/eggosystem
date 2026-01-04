import nodemailer from "nodemailer";
import { getSeasonById } from "../models/season.models";
import { getGameById, getGameByIdOrFail } from "../models/game.models";
import { getFinalizedPlayersWithEmailsAndConsent } from "./sortter-placements.services";
import { getMapNamesByIds } from "./maps.services";
import { logger } from "../utils/app-logger";
import type { Season } from "@eggosystem/types";
import { redisClient, expireIn30Days } from "../utils/redisClient";
import { getOrCreateUnsubscribeToken } from "../models/user-policy-acceptance.models";

function createTransporter() {
  if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "e2e") {
    return undefined;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: Buffer.from(process.env.SMTP_PASSWORD ?? "ZW56b2oK", "base64")
        .toString("utf8")
        .trim()
    }
  });
}

/**
 * Generate unsubscribe headers and HTML footer for emails.
 * Includes both List-Unsubscribe headers for email client support
 * and an HTML link for manual unsubscription.
 *
 * @param accountId - The account ID to generate unsubscribe link for
 * @returns Object containing headers and HTML footer with unsubscribe link
 */
async function getUnsubscribeHeadersAndFooter(accountId: number): Promise<{
  headers: { "List-Unsubscribe": string; "List-Unsubscribe-Post": string };
  footerHtml: string;
}> {
  const token = await getOrCreateUnsubscribeToken(accountId);
  const unsubscribeUrl = `${process.env.BACKEND_URL}/v1/account/unsubscribe/${token}`;

  return {
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
    },
    footerHtml: `
      <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
        Don't want to receive these emails? 
        <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
      </p>
    `
  };
}

export const sendVerificationEmail = async (to: string, token: string) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: "Kanahub by Kanaliiga <cs@kanaliiga.fi>",
    to,
    subject: "Please verify your email address for Kanahub",
    html: `
        <div style="font-family: Arial, sans-serif; color: #333; font-size: 16px; line-height: 1.5; max-width: 600px; margin: 0 auto;">
          <h1 style="color: hsl(35, 93%, 49%); font-size: 24px; text-align: left;">Verify your email address</h1>
          
          <p>Hello,</p>
  
          <p>You recently added or updated your email address in your <strong style="color: hsl(35, 93%, 49%)">Kanahub by Kanaliiga</strong> profile.</p>
  
          <p>To complete the change and verify this email address, please click the button below:</p>
  
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
            <tr>
              <td align="center" style="text-align: center; padding: 0;">
                <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td align="center" style="background-color: hsl(35, 93%, 49%); border-radius: 6px;">
                      <a href="${verificationUrl}" 
                         style="background-color: hsl(35, 93%, 49%); color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; text-align: center; font-family: Arial, sans-serif;">
                        Verify Email
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
  
          <p>If you are unable to click the button, you can also copy and paste the following link into your browser:</p>
  
          <p style="word-break: break-all;">
            <pre>${verificationUrl.replace("https://", "")}</pre>
          </p>
  
          <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
  
          <p style="font-size: 14px; color: #777;">
            If you did not request this change, you can safely ignore this email. Your profile settings will remain unchanged.
          </p>
  
          <p style="font-size: 14px; color: #777;">
            &copy; ${new Date().getFullYear()} Kanaliiga – All rights reserved.
          </p>
        </div>
      `,
    headers: {
      Date: new Date().toUTCString(),
      "Message-ID": `<${Date.now()}.${Math.random().toString(36).substring(2)}@kanaliiga.fi>`,
      "Content-Type": "text/html; charset=UTF-8"
    }
  };

  await transporter?.sendMail(mailOptions);
};

export const sendDiscordInviteEmail = async (
  to: string,
  organizationName: string,
  inviteUrl: string,
  gameTypes: string[]
) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: "Kanahub by Kanaliiga <cs@kanaliiga.fi>",
    to,
    subject: `Welcome to Kanahautomo Discord - ${organizationName}`,
    html: `
        <div style="font-family: Arial, sans-serif; color: #333; font-size: 16px; line-height: 1.5; max-width: 600px; margin: 0 auto;">
          <h1 style="color: hsl(35, 93%, 49%); font-size: 24px; text-align: left;">Welcome to Kanahautomo!</h1>
          
          <p>Hello,</p>
  
          <p>Thank you for registering for <strong style="color: hsl(35, 93%, 49%)">Kanahautomo</strong> with organization <strong>${organizationName}</strong>!</p>
  
          <p>You have been registered for the following game types:</p>
          <ul style="margin: 20px 0; padding-left: 20px;">
            ${gameTypes.map((gameType) => `<li style="margin: 5px 0;">${gameType}</li>`).join("")}
          </ul>
  
          <p>To connect with your teammates and start finding matches, please join our Discord server using the link below:</p>
  
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
            <tr>
              <td align="center" style="text-align: center; padding: 0;">
                <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td align="center" style="background-color: #5865F2; border-radius: 6px;">
                      <a href="${inviteUrl}" 
                         style="background-color: #5865F2; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; text-align: center; font-family: Arial, sans-serif;">
                        Join Discord Server
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
  
          <p>If you are unable to click the button, you can also copy and paste the following link into your browser:</p>
  
          <p style="word-break: break-all;">
            <a href="${inviteUrl}">${inviteUrl}</a>
          </p>
  
          <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
  
          <p style="font-size: 14px; color: #777;">
            If you have any questions or need assistance, please don't hesitate to reach out to our support team.
          </p>
  
          <p style="font-size: 14px; color: #777;">
            &copy; ${new Date().getFullYear()} Kanaliiga – All rights reserved.
          </p>
        </div>
      `,
    headers: {
      Date: new Date().toUTCString(),
      "Message-ID": `<${Date.now()}.${Math.random().toString(36).substring(2)}@kanaliiga.fi>`,
      "Content-Type": "text/html; charset=UTF-8"
    }
  };

  await transporter?.sendMail(mailOptions);
};

interface PlayerInfo {
  nickname: string;
  steam_id: string;
}

export const sendSeasonCaptainWelcomeEmail = async (
  to: string,
  seasonId: number,
  discordLink: string,
  players: PlayerInfo[]
) => {
  // Fetch season details to get the season name
  const season = await getSeasonById(seasonId);

  if (!season) {
    throw new Error(`Season with id ${seasonId} not found`);
  }

  // Fetch game abbreviation
  const game = await getGameById(season.game_id);
  const gameAbbreviation = game?.abbreviation || "";

  const seasonName = season.name;
  const seasonDisplayName = gameAbbreviation
    ? `${seasonName} - ${gameAbbreviation}`
    : seasonName;
  const seasonStartDate = season.start_date
    ? new Date(season.start_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : null;
  const signupEndDate = season.signup_end_date
    ? new Date(season.signup_end_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short"
      })
    : null;

  const transporter = createTransporter();
  const mailOptions = {
    from: "Kanahub by Kanaliiga <cs@kanaliiga.fi>",
    to,
    subject: `Welcome to ${seasonDisplayName} - Kanaliiga`,
    html: `
        <div style="font-family: Arial, sans-serif; color: #333; font-size: 16px; line-height: 1.5; max-width: 600px; margin: 0 auto;">
          <h1 style="color: hsl(35, 93%, 49%); font-size: 24px; text-align: left;">Welcome to ${seasonDisplayName}!</h1>
          
          <p>Hello,</p>
  
          <p>Thank you for submitting your team registration for <strong style="color: hsl(35, 93%, 49%)">${seasonDisplayName}</strong>!</p>
          
          ${
            seasonStartDate
              ? `<p>The season starts on <strong>${seasonStartDate}</strong>.</p>`
              : ""
          }
  
          <p>To receive your captain role for the upcoming season, please join the <strong style="color: hsl(35, 93%, 49%)">Kanaliiga Discord</strong> server:</p>
  
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
            <tr>
              <td align="center" style="text-align: center; padding: 0;">
                <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td align="center" style="background-color: #5865F2; border-radius: 6px;">
                      <a href="${discordLink}" 
                         style="background-color: #5865F2; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; text-align: center; font-family: Arial, sans-serif;">
                        Join Kanaliiga Discord
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
  
          <p>If you are unable to click the button, you can also copy and paste the following link into your browser:</p>
  
          <p style="word-break: break-all;">
            <a href="${discordLink}">${discordLink}</a>
          </p>
  
          ${
            season.payment_link
              ? `
          <h2 style="color: hsl(35, 93%, 49%); font-size: 20px; margin-top: 40px; margin-bottom: 15px;">Payment Required</h2>
          
          <p>Please remember to pay the participation fee for this season.${
            signupEndDate
              ? ` <strong>Payment must be completed before signup ends on ${signupEndDate}.</strong>`
              : ""
          }</p>
          
          ${
            signupEndDate
              ? `<p style="margin-bottom: 20px;"><strong>Signup ends:</strong> ${signupEndDate}</p>`
              : ""
          }
          
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
            <tr>
              <td align="center" style="text-align: center; padding: 0;">
                <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td align="center" style="background-color: hsl(35, 93%, 49%); border-radius: 6px;">
                      <a href="${season.payment_link}" 
                         style="background-color: hsl(35, 93%, 49%); color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; text-align: center; font-family: Arial, sans-serif;">
                        Pay Participation Fee
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <p style="word-break: break-all;">
            <a href="${season.payment_link}">${season.payment_link}</a>
          </p>
          `
              : ""
          }
  
          <h2 style="color: hsl(35, 93%, 49%); font-size: 20px; margin-top: 40px; margin-bottom: 15px;">Important Resources</h2>
          
          <p>As a captain, please familiarize yourself with the following resources:</p>
          
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
            <tr>
              <td style="padding: 10px 0;">
                <a href="https://wiki.kanaliiga.fi/en/CS2/CaptainsManual" 
                   style="color: hsl(35, 93%, 49%); text-decoration: none; font-weight: bold;">
                  📖 Captain's Manual
                </a>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
                  Complete guide for CS2 team captains with rules, scheduling, and important information.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">
                <a href="https://kanaliiga.fi/pelit/counter-strike-2" 
                   style="color: hsl(35, 93%, 49%); text-decoration: none; font-weight: bold;">
                  🎮 Kanaliiga CS2 Page
                </a>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
                  Visit the official Kanaliiga Counter-Strike 2 tournament page for updates and information.
                </p>
              </td>
            </tr>
          </table>
  
          <h2 style="color: hsl(35, 93%, 49%); font-size: 20px; margin-top: 40px; margin-bottom: 15px;">Registered Players</h2>
          
          <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin: 20px 0; background-color: #f9f9f9; border-radius: 6px;">
            <thead>
              <tr style="background-color: hsl(35, 93%, 49%); color: #fff;">
                <th style="text-align: left; padding: 12px; border-bottom: 2px solid #ddd;">Nickname</th>
                <th style="text-align: left; padding: 12px; border-bottom: 2px solid #ddd;">Steam ID</th>
              </tr>
            </thead>
            <tbody>
              ${players
                .map(
                  (player) => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #eee;">${player.nickname}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #eee; font-family: monospace;">${player.steam_id}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
  
          <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
  
          <p style="font-size: 14px; color: #777;">
            If you have any questions or need assistance, please don't hesitate to reach out to our support team on Discord.
          </p>
  
          <p style="font-size: 14px; color: #777;">
            &copy; ${new Date().getFullYear()} Kanaliiga – All rights reserved.
          </p>
        </div>
      `,
    headers: {
      Date: new Date().toUTCString(),
      "Message-ID": `<${Date.now()}.${Math.random().toString(36).substring(2)}@kanaliiga.fi>`,
      "Content-Type": "text/html; charset=UTF-8"
    }
  };

  await transporter?.sendMail(mailOptions);
};

const sendSeasonWelcomeEmail = async (
  to: string,
  accountId: number,
  seasonDisplayName: string,
  seasonStartDate: string | null,
  teamName: string,
  leagueName: string,
  platform: string,
  rulebookUrl: string | null,
  discordLink: string | null,
  mapNames: string[]
) => {
  const transporter = createTransporter();

  // Get unsubscribe headers and footer
  const { headers: unsubscribeHeaders, footerHtml: unsubscribeFooter } =
    await getUnsubscribeHeadersAndFooter(accountId);

  const mailOptions = {
    from: "Kanahub by Kanaliiga <cs@kanaliiga.fi>",
    to,
    subject: `Welcome to ${seasonDisplayName} - Kanaliiga`,
    html: `
        <div style="font-family: Arial, sans-serif; color: #333; font-size: 16px; line-height: 1.5; max-width: 600px; margin: 0 auto;">
          <h1 style="color: hsl(35, 93%, 49%); font-size: 24px; text-align: left;">Welcome to ${seasonDisplayName}!</h1>
          
          <p>Hello,</p>
  
          <p>Your team <strong style="color: hsl(35, 93%, 49%)">${teamName}</strong> has been placed in <strong>${seasonDisplayName}</strong>!</p>
          
          ${
            seasonStartDate
              ? `<p>The season starts on <strong>${seasonStartDate}</strong>.</p>`
              : ""
          }

          <h2 style="color: hsl(35, 93%, 49%); font-size: 20px; margin-top: 30px; margin-bottom: 15px;">Season Details</h2>
          
          <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin: 20px 0; background-color: #f9f9f9; border-radius: 6px;">
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong>Team:</strong></td>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">${teamName}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong>League:</strong></td>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">${leagueName}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong>Platform:</strong></td>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">${platform}</td>
            </tr>
            ${
              mapNames.length > 0
                ? `
            <tr>
              <td style="padding: 12px;"><strong>Active Map Pool:</strong></td>
              <td style="padding: 12px;">${mapNames.join(", ")}</td>
            </tr>
            `
                : ""
            }
          </table>

          ${
            discordLink
              ? `
          <h2 style="color: hsl(35, 93%, 49%); font-size: 20px; margin-top: 30px; margin-bottom: 15px;">Join the Community</h2>
          
          <p>Connect with other players and get important updates by joining our Discord server:</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
            <tr>
              <td align="center" style="text-align: center; padding: 0;">
                <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td align="center" style="background-color: #5865F2; border-radius: 6px;">
                      <a href="${discordLink}" 
                         style="background-color: #5865F2; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; text-align: center; font-family: Arial, sans-serif;">
                        Join Discord Server
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <p style="word-break: break-all;">
            <a href="${discordLink}">${discordLink}</a>
          </p>
          `
              : ""
          }

          ${
            rulebookUrl
              ? `
          <h2 style="color: hsl(35, 93%, 49%); font-size: 20px; margin-top: 30px; margin-bottom: 15px;">Important Information</h2>
          
          <p>Please review the season rulebook to familiarize yourself with the rules and regulations:</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
            <tr>
              <td align="center" style="text-align: center; padding: 0;">
                <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td align="center" style="background-color: hsl(35, 93%, 49%); border-radius: 6px;">
                      <a href="${rulebookUrl}" 
                         style="background-color: hsl(35, 93%, 49%); color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; text-align: center; font-family: Arial, sans-serif;">
                        View Rulebook
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <p style="word-break: break-all;">
            <a href="${rulebookUrl}">${rulebookUrl}</a>
          </p>
          `
              : ""
          }
  
          <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
  
          <p style="font-size: 14px; color: #777;">
            Good luck in the season! If you have any questions, please reach out to your team captain or contact us on Discord.
          </p>
  
          <p style="font-size: 14px; color: #777;">
            &copy; ${new Date().getFullYear()} Kanaliiga – All rights reserved.
          </p>
  
          <p style="font-size: 14px; color: #777; margin-top: 20px;">
            <a href="https://hub.kanaliiga.fi" style="color: hsl(35, 93%, 49%); text-decoration: none;">hub.kanaliiga.fi</a> | 
            <a href="https://kanaliiga.fi" style="color: hsl(35, 93%, 49%); text-decoration: none;">kanaliiga.fi</a>
          </p>
          
          ${unsubscribeFooter}
        </div>
      `,
    headers: {
      Date: new Date().toUTCString(),
      "Message-ID": `<${Date.now()}.${Math.random().toString(36).substring(2)}@kanaliiga.fi>`,
      "Content-Type": "text/html; charset=UTF-8",
      ...unsubscribeHeaders
    }
  };

  await transporter?.sendMail(mailOptions);
};

export const sendMatchScheduleChangeEmail = async (
  to: string,
  matchDetails: {
    teamNames: string;
    oldDate: string;
    oldTime: string;
    newDate: string;
    newTime: string;
    reservationHash: string;
  }
) => {
  const transporter = createTransporter();
  const removalUrl = `${process.env.FRONTEND_URL}/api/v1/reservations/remove/${matchDetails.reservationHash}`;

  const mailOptions = {
    from: "Kanahub by Kanaliiga <cs@kanaliiga.fi>",
    to,
    subject: `Match Schedule Changed - ${matchDetails.teamNames}`,
    html: `
        <div style="font-family: Arial, sans-serif; color: #333; font-size: 16px; line-height: 1.5; max-width: 600px; margin: 0 auto;">
          <h1 style="color: hsl(35, 93%, 49%); font-size: 24px; text-align: left;">Match Schedule Changed</h1>
          
          <p>Hello,</p>
  
          <p>The schedule for a match you reserved for streaming has been changed.</p>
  
          <h2 style="color: hsl(35, 93%, 49%); font-size: 20px; margin-top: 30px; margin-bottom: 15px;">Match Details</h2>
          
          <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin: 20px 0; background-color: #f9f9f9; border-radius: 6px;">
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong>Teams:</strong></td>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">${matchDetails.teamNames}</td>
            </tr>
            <tr style="background-color: #fff3cd;">
              <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong>Previous Time:</strong></td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-decoration: line-through; color: #666;">${matchDetails.oldDate} at ${matchDetails.oldTime}</td>
            </tr>
            <tr style="background-color: #d4edda;">
              <td style="padding: 12px;"><strong>New Time:</strong></td>
              <td style="padding: 12px; font-weight: bold; color: hsl(35, 93%, 49%);">${matchDetails.newDate} at ${matchDetails.newTime}</td>
            </tr>
          </table>
  
          <p>If the new time doesn't work for you, you can easily remove your reservation by clicking the button below:</p>
  
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
            <tr>
              <td align="center" style="text-align: center; padding: 0;">
                <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td align="center" style="background-color: #dc3545; border-radius: 6px;">
                      <a href="${removalUrl}" 
                         style="background-color: #dc3545; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; text-align: center; font-family: Arial, sans-serif;">
                        Remove My Reservation
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
  
          <p>If you are unable to click the button, you can also copy and paste the following link into your browser:</p>
  
          <p style="word-break: break-all;">
            <pre>${removalUrl.replace("https://", "")}</pre>
          </p>
  
          <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
  
          <p style="font-size: 14px; color: #777;">
            If you can still stream at the new time, no action is needed. Your reservation remains active.
          </p>
  
          <p style="font-size: 14px; color: #777;">
            &copy; ${new Date().getFullYear()} Kanaliiga – All rights reserved.
          </p>
        </div>
      `,
    headers: {
      Date: new Date().toUTCString(),
      "Message-ID": `<${Date.now()}.${Math.random().toString(36).substring(2)}@kanaliiga.fi>`,
      "Content-Type": "text/html; charset=UTF-8"
    }
  };

  await transporter?.sendMail(mailOptions);
};

/**
 * Send welcome emails to all finalized players for a season
 * This function runs asynchronously and does not block the caller
 * @param seasonId - Season ID
 * @param season - Season object with all necessary data
 */
export const sendSeasonFinalizationWelcomeEmails = async (
  seasonId: number,
  season: Season
): Promise<void> => {
  try {
    logger.info(
      `Starting welcome email sending for season ${seasonId} finalization`
    );

    // Get players with emails and newsletter consent
    const players = await getFinalizedPlayersWithEmailsAndConsent(seasonId);

    if (players.length === 0) {
      logger.info(
        `No players eligible for welcome email in season ${seasonId}`
      );
      return;
    }

    const game = await getGameByIdOrFail(season.game_id);
    const gameAbbreviation = game.abbreviation;
    const seasonDisplayName = gameAbbreviation
      ? `${season.name} - ${gameAbbreviation}`
      : season.name;

    // Format season start date
    const seasonStartDate = season.start_date
      ? new Date(season.start_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        })
      : null;

    // Get map names from active map pool
    const mapNames = await getMapNamesByIds(season.active_map_pool || []);

    // Send emails in parallel and collect errors with account_id
    const emailPromises = players.map((player) =>
      sendSeasonWelcomeEmail(
        player.email,
        player.account_id,
        seasonDisplayName,
        seasonStartDate,
        player.team_name,
        player.league_name,
        season.platform,
        season.rulebook_url,
        season.discord_link,
        mapNames
      )
        .then(() => ({ success: true as const, account_id: player.account_id }))
        .catch((error: unknown) => {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error(
            `Failed to send welcome email to ${player.nickname} (${player.email})`,
            error
          );
          return {
            success: false as const,
            account_id: player.account_id,
            error: errorMessage
          };
        })
    );

    const results = await Promise.allSettled(emailPromises);

    // Collect successful and failed results
    const successfulResults: Array<{ success: true; account_id: number }> = [];
    const failedErrors: Array<{ account_id: number; error: string }> = [];

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        if (result.value.success) {
          successfulResults.push(result.value);
        } else {
          failedErrors.push({
            account_id: result.value.account_id,
            error: result.value.error
          });
        }
      } else {
        // If the promise itself was rejected (shouldn't happen with our catch, but handle it)
        logger.error(
          `Unexpected promise rejection in email sending: ${result.reason}`
        );
      }
    });

    const successful = successfulResults.length;
    const failed = failedErrors.length;

    // Store failed errors in Redis if any
    if (failedErrors.length > 0) {
      try {
        // Create Redis key: season name with spaces replaced by dashes, plus season ID
        // Format: {season-name-with-dashes}-{season-id}-failed-welcome-messages
        const seasonNameKey = season.name.toLowerCase().replace(/\s+/g, "-");
        const redisKey = `${seasonNameKey}-${seasonId}-failed-welcome-messages`;

        await redisClient.set(
          redisKey,
          JSON.stringify(failedErrors),
          "EX",
          expireIn30Days
        );

        logger.info(
          `Stored ${failedErrors.length} failed welcome email errors in Redis with key: ${redisKey}`
        );
      } catch (redisError) {
        logger.error(
          `Failed to store email errors in Redis for season ${seasonId}`,
          redisError
        );
      }
    }

    logger.info(
      `Welcome emails sent for season ${seasonId}: ${successful} successful, ${failed} failed out of ${players.length} eligible players`
    );
  } catch (error) {
    logger.error(`Error sending welcome emails for season ${seasonId}`, error);
  }
};
