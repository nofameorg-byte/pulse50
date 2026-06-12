"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white max-w-4xl mx-auto p-6">
      <Link
        href="/"
        className="text-yellow-400 hover:underline"
      >
        ← Back to Pulse50
      </Link>

      <h1 className="text-4xl font-black text-yellow-400 mt-6 mb-6">
        Privacy Policy
      </h1>

      <div className="space-y-6 text-gray-300">

        <p>
          <strong>Effective Date:</strong> June 2026
        </p>

        <p>
          Pulse50 respects your privacy and is committed to protecting your information.
        </p>

        <h2 className="text-xl font-bold text-white">
          Information We Collect
        </h2>

        <h3 className="text-lg font-bold text-yellow-400">
          Account Information
        </h3>

        <ul className="list-disc pl-6 space-y-1">
          <li>Email address</li>
          <li>State selection</li>
          <li>Account identifiers</li>
          <li>Authentication information</li>
        </ul>

        <h3 className="text-lg font-bold text-yellow-400">
          Activity Information
        </h3>

        <ul className="list-disc pl-6 space-y-1">
          <li>Votes</li>
          <li>Comments</li>
          <li>Replies</li>
          <li>Poll participation</li>
          <li>TownHall participation</li>
          <li>PulseNow interactions</li>
          <li>Reports submitted</li>
          <li>General platform activity</li>
        </ul>

        <h3 className="text-lg font-bold text-yellow-400">
          Technical Information
        </h3>

        <ul className="list-disc pl-6 space-y-1">
          <li>Device information</li>
          <li>Browser information</li>
          <li>IP address</li>
          <li>Usage analytics</li>
          <li>Error and performance logs</li>
        </ul>

        <h2 className="text-xl font-bold text-white">
          How We Use Information
        </h2>

        <p>
          We use information to operate the platform, improve user experience,
          prevent abuse, moderate content, maintain security,
          generate civic identity features, and analyze performance.
        </p>

        <h2 className="text-xl font-bold text-white">
          Public Information
        </h2>

        <p>
          Your civic identity, comments, votes, discussions,
          and participation may be visible to other users.
        </p>

        <p>
          Your email address is not publicly displayed.
        </p>

        <h2 className="text-xl font-bold text-white">
          Data Security
        </h2>

        <p>
          We use commercially reasonable safeguards to protect user information.
          However, no internet-based system can guarantee complete security.
        </p>

        <h2 className="text-xl font-bold text-white">
          Third-Party Services
        </h2>

        <p>
          Pulse50 may utilize third-party providers including hosting,
          authentication, analytics, email delivery, AI services,
          storage providers, and content delivery networks.
        </p>

        <h2 className="text-xl font-bold text-white">
          Cookies
        </h2>

        <p>
          Pulse50 may use cookies and similar technologies to maintain sessions,
          improve performance, remember preferences, and enhance functionality.
        </p>

        <h2 className="text-xl font-bold text-white">
          Children's Privacy
        </h2>

        <p>
          Pulse50 is not intended for children under 13.
        </p>

        <h2 className="text-xl font-bold text-white">
          Account Deletion
        </h2>

        <p>
          Users may request account deletion by contacting administrators.
        </p>

        <h2 className="text-xl font-bold text-white">
          Changes
        </h2>

        <p>
          This Privacy Policy may be updated periodically.
        </p>

        <h2 className="text-xl font-bold text-white">
          Contact
        </h2>

        <p>
          NOFAME NextGen AI LLC
          <br />
          Pulse50.org
        </p>

      </div>
    </main>
  );
}