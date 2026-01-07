import nodemailer from "nodemailer";
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

/**
 * Send a welcome email to a player for a season
 */
export const sendSeasonWelcomeEmail = async (
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
    cc: "cs@kanaliiga.fi",
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
