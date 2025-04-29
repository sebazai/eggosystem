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
      pass: Buffer.from(
        process.env.SMTP_PASSWORD ?? "ZW56b2oK",
        "base64"
      ).toString("utf8")
    }
  });
}

const transporter = createTransporter();

export const sendVerificationEmail = (to: string, token: string) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: "Kanahub by Kanaliiga <noreply@kanaliiga.fi>",
    to,
    subject: "Please verify your email address for Kanahub",
    html: `
        <div style="font-family: Arial, sans-serif; color: #333; font-size: 16px; line-height: 1.5;">
          <h1 style="color: hsl(35, 93%, 49%); font-size: 24px;">Verify your email address</h1>
          
          <p>Hello,</p>
  
          <p>You recently added or updated your email address in your <strong style="color: hsl(35, 93%, 49%)">Kanahub by Kanaliiga</strong> profile.</p>
  
          <p>To complete the change and verify this email address, please click the button below:</p>
  
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: hsl(35, 93%, 49%); color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
              Verify Email
            </a>
          </div>
  
          <p>If you are unable to click the button, you can also copy and paste the following link into your browser:</p>
  
          <p style="word-break: break-all;">
            <a href="${verificationUrl}" style="color: hsl(29, 56%, 58%);">${verificationUrl}</a>
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

  transporter?.sendMail(mailOptions);
};
