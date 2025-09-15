import { createPageMetadata } from "@/lib/metadata";
import { createNextUrl } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy"
});

export default function PrivacyPolicy() {
  return (
    <div className="privacy-policy">
      <h1>Privacy Policy</h1>
      <p>Effective Date: 1st of April 2025</p>
      <p>Last Updated: 12th of May 2025</p>

      <h2>1. Introduction</h2>
      <p>
        Welcome to Kanahub by Kanaliiga. Your privacy is important to us. This
        Privacy Policy explains how we collect, use, and protect your personal
        data when you participate in our esports platform.
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
          <strong>Team and Organization Association:</strong> Linked through
          your <strong>Steam ID</strong>
        </li>
        <li>
          <strong>Performance and Game Data:</strong> Parsed from matches for
          ranking and statistical purposes.
        </li>
        <li>
          <strong>Personal Email or Work Email & Full Name:</strong> Collected
          with consent to verify your team/organization.
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
          associated with their teams/organizations.
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
          Stored for ranking history and statistical purposes.
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
          <Link href={createNextUrl("/profile")}>your profile</Link>
        </li>
        <li>
          <strong>Deletion:</strong> You can request the deletion of your{" "}
          <strong>personal email, work email, and full name</strong> at any
          time. However,{" "}
          <strong>Steam ID and nickname cannot be deleted</strong> due to their
          essential role in maintaining ranking history and statistical
          tracking. If you wish to have them anonymized, we can replace your
          Steam ID and nickname with random identifiers, ensuring they can no
          longer be traced back to you.
        </li>
      </ul>

      <h2>6. Marketing Communications</h2>
      <p>
        If you have opted in to receive marketing communications, we will use
        your personal data to send you relevant updates, event notifications,
        and promotions related to Kanaliiga Ry.
      </p>
      <p>
        We will never share your personal data with third parties for marketing
        purposes. All marketing communications will come exclusively from
        Kanaliiga Ry and will not be shared with external organizations for
        marketing purposes.
      </p>
      <p>
        You can withdraw your consent at any time by updating your profile
        settings or by clicking the unsubscribe link in any marketing email you
        receive.
      </p>

      <h2>7. Data Sharing with Third Parties</h2>
      <p>
        We may share your personal data with third parties for the purposes
        outlined in this Privacy Policy. This data sharing is based on our
        legitimate interests in providing our services and facilitating the
        organization of events, tournaments, and other activities related to the
        Kanaliiga platform.
      </p>
      <p>We may share the following data with trusted third parties:</p>
      <ul className="list-disc list-inside px-4 pb-2">
        <li>
          <strong>esports Partners (e.g., Faceit):</strong> To facilitate
          tournament and game participation, we may share your Steam ID,
          nickname, and other relevant performance data.
        </li>
        <li>
          <strong>Game Platforms (e.g., Steam):</strong> To verify your game
          participation, we may share your Steam ID and nickname.
        </li>
        <li>
          <strong>Tournament Organizers:</strong> To organize finals, live
          tournaments, and other competitive events, we may share your Steam ID,
          nickname, and other relevant data.
        </li>
        <li>
          <strong>Other Kanaliiga Ry Services:</strong> Your data may also be
          shared with other Kanaliiga Ry services that facilitate your
          participation in community events, rankings, or other services related
          to your involvement in the platform.
        </li>
      </ul>
      <p>
        We do not share your full name, work email, or personal email with third
        parties unless necessary for event coordination or related services. Any
        data sharing with third parties is solely to support your participation
        in Kanaliiga events and to ensure proper management of the platform and
        competitions.
      </p>

      <h2>8. Security Measures</h2>
      <p>
        We implement strong security measures to protect your personal data,
        including:
      </p>
      <ul className="list-disc list-inside px-4 pb-2">
        <li>
          <strong>Access Control:</strong> Only authorized personnel can access
          personal data.
        </li>
        <li>
          <strong>Encryption:</strong> Protecting data storage and
          transmissions.
        </li>
        <li>
          <strong>Audit Logging:</strong> We maintain audit logs for tables
          containing personal data to track and monitor access and
          modifications. Steam ID and nickname are excluded from this logging,
          as they are not considered sensitive for these purposes.
        </li>
      </ul>

      <h2>9. Updates to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Changes will be
        notified via a banner on our website.
      </p>

      <h2>Contact Information</h2>
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
