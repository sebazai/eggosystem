import nodemailer from "nodemailer";

function createTransporter() {
  if (process.env.NODE_ENV === "test") {
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

const transporter = createTransporter();

export const sendVerificationEmail = async (to: string, token: string) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: "Kanahub by Kanaliiga <noreply@kanaliiga.fi>",
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
            <a href="${verificationUrl}">${verificationUrl}</a>
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
  const mailOptions = {
    from: "Kanahub by Kanaliiga <noreply@kanaliiga.fi>",
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
  
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="margin-top: 0; color: #333;">What happens next?</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li style="margin: 5px 0;">Join the Discord server using the link above</li>
              <li style="margin: 5px 0;">You'll be automatically assigned to your organization's role</li>
              <li style="margin: 5px 0;">Find your organization's channels for the games you registered for</li>
              <li style="margin: 5px 0;">Start connecting with teammates and finding matches!</li>
            </ul>
          </div>
  
          <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
  
          <p style="font-size: 14px; color: #777;">
            If you have any questions or need assistance, please contact us through the Discord server or email us at <a href="mailto:info@kanaliiga.fi">info@kanaliiga.fi</a>.
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
