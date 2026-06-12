"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white max-w-4xl mx-auto p-6">
      <Link
        href="/"
        className="text-yellow-400 hover:underline"
      >
        ← Back to Pulse50
      </Link>

      <h1 className="text-4xl font-black text-yellow-400 mt-6 mb-6">
        Terms of Service
      </h1>

      <div className="space-y-6 text-gray-300">

        <p>
          <strong>Effective Date:</strong> June 2026
        </p>

        <p>
          By accessing or using Pulse50, you agree to these Terms of Service.
        </p>

        <h2 className="text-xl font-bold text-white">
          Acceptance of Terms
        </h2>

        <p>
          By using Pulse50, you agree to comply with these terms and all applicable laws.
          If you do not agree, do not use the platform.
        </p>

        <h2 className="text-xl font-bold text-white">
          Eligibility
        </h2>

        <p>
          Users must be at least 13 years old.
          Users under 18 should use the platform with parental guidance.
        </p>

        <h2 className="text-xl font-bold text-white">
          User Accounts
        </h2>

        <ul className="list-disc pl-6 space-y-1">
          <li>Maintaining account security</li>
          <li>Keeping login information confidential</li>
          <li>All activity occurring under their account</li>
        </ul>

        <p>
          Pulse50 may suspend or terminate accounts that violate these terms.
        </p>

        <h2 className="text-xl font-bold text-white">
          User Content
        </h2>

        <p>
          Users retain ownership of content they submit.
          By posting content, you grant Pulse50 a non-exclusive license to display,
          store, reproduce, and distribute content within the platform.
        </p>

        <h2 className="text-xl font-bold text-white">
          Prohibited Conduct
        </h2>

        <ul className="list-disc pl-6 space-y-1">
          <li>Harass, threaten, or intimidate others</li>
          <li>Post unlawful content</li>
          <li>Post false or misleading information intentionally</li>
          <li>Impersonate another individual or organization</li>
          <li>Attempt unauthorized access to systems</li>
          <li>Disrupt platform operations</li>
          <li>Use bots or automated manipulation systems</li>
          <li>Engage in vote manipulation or fraud</li>
        </ul>

        <h2 className="text-xl font-bold text-white">
          Moderation
        </h2>

        <p>
          Pulse50 reserves the right to remove content, hide content,
          restrict accounts, suspend accounts, or permanently ban accounts.
        </p>

        <h2 className="text-xl font-bold text-white">
          Public Nature of Content
        </h2>

        <p>
          Comments, votes, discussions, and public participation may be visible
          to other users. Users should avoid sharing sensitive personal information.
        </p>

        <h2 className="text-xl font-bold text-white">
          No Government Affiliation
        </h2>

        <p>
          Pulse50 is an independent civic engagement platform and is not affiliated
          with, endorsed by, or operated by any government agency unless explicitly stated.
        </p>

        <h2 className="text-xl font-bold text-white">
          Disclaimer
        </h2>

        <p>
          Information presented on Pulse50 may be provided by users,
          public records, or third-party sources.
        </p>

        <p>
          Pulse50 does not guarantee accuracy, completeness,
          or timeliness of all information.
        </p>

        <h2 className="text-xl font-bold text-white">
          Limitation of Liability
        </h2>

        <p>
          Pulse50 shall not be liable for indirect, incidental,
          special, or consequential damages arising from platform use.
        </p>

        <h2 className="text-xl font-bold text-white">
          Changes
        </h2>

        <p>
          These Terms may be updated periodically.
          Continued use of Pulse50 constitutes acceptance of revised terms.
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