import { envConfig } from "@/configs/env";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy"
};

export default function PrivacyPolicy() {
  return (
    <div className="privacy-policy">
      <h1>Privacy Policy</h1>
      <p>Effective Date: 1st of April 2025</p>
      <p>Last Updated: 29th of April 2025</p>

      <h2>1. Introduction</h2>
      <p>
        Welcome to Kanahub by Kanaliiga. Your privacy is important to us. This
        Privacy Policy explains how we collect, use, and protect your personal
        data when you participate in our eSports platform.
      </p>

      <h2>2. Data We Collect</h2>
      <p>
        By participating in a game organized by Kanaliiga, we collect and store
        the following data:
      </p>
      <ul className="list-disc list-inside px-4 pb-2">
        <li>
          <strong>Steam ID and Nickname:</strong> Required to track your
          participation in games.
        </li>
        <li>
          <strong>Team and Organization Association:</strong> Linked to your{" "}
          <strong>Steam ID</strong> and stored permanently, even if you change
          teams or organizations.
        </li>
        <li>
          <strong>Performance and Game Data:</strong> Parsed from matches for
          ranking and statistical purposes.
        </li>
        <li>
          <strong>Personal Email & Work Email & Full Name:</strong> Collected
          with consent to verify your team/organization.{" "}
          <strong>This information is never shared with third parties.</strong>
        </li>
      </ul>

      <h2>3. Why We Process Your Data</h2>
      <p>We process your data for the following reasons:</p>
      <ul className="list-disc list-inside px-4 pb-2">
        <li>
          <strong>Ranking History & Statistics:</strong> To maintain player
          records and provide statistical services.
        </li>
        <li>
          <strong>Verification:</strong> Ensuring players are correctly
          associated with their teams/companies.
        </li>
      </ul>

      <h2>4. Data Retention</h2>
      <p>We retain:</p>
      <ul className="list-disc list-inside px-4 pb-2">
        <li>
          <strong>
            Steam ID, Nickname, Team and/or Organization Association &
            Performance Data:
          </strong>{" "}
          Permanently stored for ranking history and statistical purposes.
        </li>
        <li>
          <strong>Personal Email & Work Email & Full Name:</strong> Stored until
          a user requests deletion.
        </li>
      </ul>

      <h2>5. User Rights</h2>
      <p>Under the GDPR, you have rights regarding your personal data:</p>
      <ul className="list-disc list-inside px-4 pb-2">
        <li>
          <strong>Access:</strong> You can request a copy of the personal data
          we store.
        </li>
        <li>
          <strong>Correction:</strong> If any information is incorrect, you can
          request a correction. You can also edit your personal data in{" "}
          <Link href={`${envConfig.BASE_URL}/profile`}>your profile</Link>
        </li>
        <li>
          <strong>Deletion:</strong> You can request the deletion of your{" "}
          <strong>personal email, work email and full name</strong>. However,{" "}
          <strong>
            Steam ID, nickname, performance data, and team or organization
            association cannot be deleted
          </strong>{" "}
          as they are essential for ranking history and statistical tracking.
        </li>
      </ul>
      <p>
        To exercise your rights, please contact us at{" "}
        <a href="mailto:info@kanaliiga.fi">info@kanaliiga.fi</a>.
      </p>

      <h2>6. Data Sharing with Third Parties</h2>
      <p>
        We may share certain data with third parties, but{" "}
        <strong>
          we never share your full name, work email or personal email with any
          third party.
        </strong>
      </p>
      <p>
        We may share information, such as SteamID and nickname, to the
        following:
      </p>
      <ul className="list-disc list-inside px-4 pb-2">
        <li>
          <strong>eSports Partners (e.g., Faceit):</strong> To facilitate
          tournament and game participation.
        </li>
        <li>
          <strong>Game Platforms (e.g., Steam):</strong> Where the games are
          played.
        </li>
      </ul>
      <p>We do not sell or rent your data to third parties.</p>

      <h2>7. Security Measures</h2>
      <p>We implement strong security measures, including:</p>
      <ul className="list-disc list-inside px-4 pb-2">
        <li>
          <strong>Access Control:</strong> Only authorized personnel can access
          personal data.
        </li>
        <li>
          <strong>Encryption:</strong> Protecting data storage and
          transmissions.
        </li>
      </ul>

      <h2>8. Updates to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Changes will be
        notified via a banner on our website.
      </p>

      <h2>9. Contact Information</h2>
      <p>
        If you have any questions or requests regarding your personal data,
        please contact us at:
      </p>
      <p>
        <strong>Email:</strong>{" "}
        <a href="mailto:info@kanaliiga.fi">info@kanaliiga.fi</a>
      </p>
    </div>
  );
}
