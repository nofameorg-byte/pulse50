"use client";

import Link from "next/link";

export default function InstructionsPage() {
  return (
    <main className="min-h-screen bg-black text-white max-w-4xl mx-auto p-6">

      <Link
        href="/"
        className="text-yellow-400 hover:underline text-sm"
      >
        ← Back to Pulse50
      </Link>

      <h1 className="text-4xl font-black text-yellow-400 mt-6 mb-6">
        Pulse50 Instructions
      </h1>

      <div className="space-y-8 text-gray-300">

        <section>
          <h2 className="text-xl font-bold text-white mb-2">
            Welcome to Pulse50
          </h2>

          <p>
            Welcome to Pulse50 — The People's Voice.
          </p>

          <p className="mt-2">
            Pulse50 is a public civic engagement platform where citizens can learn
            about elected officials, vote on public sentiment, participate in
            discussions, answer public polls, share community concerns, and engage
            in civic conversations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">
            Getting Started
          </h2>

          <h3 className="font-bold text-yellow-400 mt-4">
            Create an Account
          </h3>

          <ol className="list-decimal pl-6 space-y-1">
            <li>Select your state.</li>
            <li>Create an account using your email address.</li>
            <li>Verify your email address if prompted.</li>
            <li>Sign in and begin participating.</li>
          </ol>

          <h3 className="font-bold text-yellow-400 mt-6">
            Your Civic Identity
          </h3>

          <p>
            Pulse50 automatically generates a civic identity based on your state.
          </p>

          <p className="mt-2">
            Your civic identity is displayed publicly when you vote, comment,
            or participate in discussions. Your email address is never displayed publicly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">
            Representatives Directory
          </h2>

          <p>
            Browse local, state, and federal representatives.
          </p>

          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>View public profiles</li>
            <li>Vote Approve or Disapprove</li>
            <li>Join discussions</li>
            <li>Share opinions respectfully</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">
            Polls
          </h2>

          <p>
            Participate in Pulse Polls to share your opinion on current issues.
          </p>

          <p className="mt-2">
            Each user may vote once per poll.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">
            PulseNow
          </h2>

          <p>
            Watch and engage with civic and community-related video content.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">
            TownHall
          </h2>

          <p>
            TownHall allows citizens to discuss local concerns, public issues,
            community events, and government matters.
          </p>

          <p className="mt-2">
            Be respectful and constructive when posting.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">
            Mobile App Experience
          </h2>

          <p>
            Pulse50 works like an app directly from your phone browser.
          </p>

          <h3 className="font-bold text-yellow-400 mt-4">
            iPhone (Safari)
          </h3>

          <ol className="list-decimal pl-6 space-y-1">
            <li>Visit Pulse50.org in Safari.</li>
            <li>Tap the Share button.</li>
            <li>Select Add to Home Screen.</li>
            <li>Tap Add.</li>
          </ol>

          <p className="mt-2">
            Pulse50 will appear on your home screen and launch like a mobile app.
          </p>

          <h3 className="font-bold text-yellow-400 mt-6">
            Android (Chrome)
          </h3>

          <ol className="list-decimal pl-6 space-y-1">
            <li>Visit Pulse50.org in Chrome.</li>
            <li>Tap the three-dot menu.</li>
            <li>Select Add to Home Screen or Install App.</li>
            <li>Confirm installation.</li>
          </ol>

          <p className="mt-2">
            Pulse50 will appear on your home screen and operate like a native application.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">
            Community Standards
          </h2>

          <p>Users must not:</p>

          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Harass or threaten others</li>
            <li>Post illegal content</li>
            <li>Impersonate public officials</li>
            <li>Spam discussions</li>
            <li>Attempt to manipulate votes</li>
            <li>Post hate speech or discriminatory content</li>
            <li>Promote violence</li>
          </ul>

          <p className="mt-4">
            Violations may result in content removal, account restrictions,
            suspension, or permanent bans.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">
            Reporting Content
          </h2>

          <p>
            Users may report comments or content that violate community standards.
          </p>

          <p className="mt-2">
            Reports are reviewed by administrators.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-2">
            Important Notice
          </h2>

          <p>
            Pulse50 is a public opinion platform.
          </p>

          <p className="mt-2">
            Votes, discussions, polls, comments, and other content reflect the
            opinions of individual users and do not represent official government
            positions or policies.
          </p>
        </section>

      </div>
    </main>
  );
}