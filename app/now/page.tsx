"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Pulse50NowPage() {
  const router = useRouter();

  const videos = [
    {
      id: "ln-FnwDYE4Y",
      title: "Pulse50 Now — Civic Discussion",
      category: "Featured",
    },
    {
      id: "dQw4w9WgXcQ",
      title: "Local Government Meeting",
      category: "Local",
    },
    {
      id: "dQw4w9WgXcQ",
      title: "Election Coverage",
      category: "Elections",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white">

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-4">
          <Link href="/" className="text-2xl md:text-3xl font-black tracking-tight">
            <span className="text-white">Pulse</span>
            <span className="text-yellow-400">50</span>
            <span className="ml-2 text-xs uppercase tracking-widest text-yellow-400">
              NOW
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/representatives"
              className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider"
            >
              Representatives
            </Link>

            <Link
              href="/trending"
              className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition uppercase tracking-wider"
            >
              Trending
            </Link>

            <button
              onClick={() => router.push("/")}
              className="border border-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-gray-300 hover:border-yellow-400 hover:text-yellow-400 transition"
            >
              Back Home
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10 px-4 md:px-6 py-20 md:py-28">

        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="absolute top-0 left-0 bottom-0 w-1 bg-yellow-400" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400 mb-4">
            Real-Time Civic Media
          </p>

          <h1 className="text-5xl md:text-7xl font-black leading-none mb-6">
            PULSE50
            <br />
            <span className="text-yellow-400">NOW</span>
          </h1>

          <p className="max-w-2xl text-gray-400 text-lg leading-relaxed">
            Watch civic discussions, local government coverage, hearings,
            elections, political commentary, and community issues from across
            the country.
          </p>
        </div>
      </section>

      {/* VIDEOS */}
      <section className="px-4 md:px-6 py-12">
        <div className="mx-auto max-w-7xl">

          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">
                Featured Coverage
              </p>

              <h2 className="text-3xl md:text-5xl font-black">
                Latest Videos
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {videos.map((video, index) => (
              <div
                key={index}
                className="border border-white/10 bg-white/[0.02] overflow-hidden hover:border-yellow-400 transition"
              >
                <div className="aspect-video w-full">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title={video.title}
                    allowFullScreen
                  />
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-yellow-400 text-black text-xs font-black px-2 py-1 uppercase tracking-wider">
                      {video.category}
                    </span>

                    <span className="text-gray-600 text-xs uppercase tracking-widest">
                      Pulse50 Now
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white leading-tight">
                    {video.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black px-6 py-10 mt-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
          <div className="text-2xl font-black">
            <span className="text-white">Pulse</span>
            <span className="text-yellow-400">50</span>
            <span className="ml-2 text-xs uppercase tracking-widest text-yellow-400">
              NOW
            </span>
          </div>

          <p className="text-xs text-gray-600">
            Civic media, hearings, elections, and public discussion coverage.
          </p>
        </div>
      </footer>
    </main>
  );
}