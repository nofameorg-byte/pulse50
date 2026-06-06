"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-yellow-400" : "text-gray-500"}`}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 0 : 2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    href: "/representatives",
    label: "Directory",
    icon: (active: boolean) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-yellow-400" : "text-gray-500"}`}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 0 : 2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    href: "/trending",
    label: "Trending",
    icon: (active: boolean) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-yellow-400" : "text-gray-500"}`}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 0 : 2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </svg>
    ),
  },
  {
    href: "/Polls",
    label: "States",
    icon: (active: boolean) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-yellow-400" : "text-gray-500"}`}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 0 : 2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
        />
      </svg>
    ),
  },

{
  href: "/now",
  label: "Now",
  icon: (active: boolean) => (
    <svg
      className={`w-5 h-5 transition-colors ${active ? "text-yellow-400" : "text-gray-500"}`}
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 0 : 2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  ),
},

  {
    href: "/login",
    label: "Account",
    icon: (active: boolean) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-yellow-400" : "text-gray-500"}`}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 0 : 2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/95 backdrop-blur-xl">
      <div className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                active ? "bg-yellow-400/5" : "hover:bg-white/5"
              }`}
            >
              {/* Active indicator bar */}
              <span
                className={`absolute top-0 h-0.5 w-8 transition-all duration-300 ${
                  active ? "bg-yellow-400" : "bg-transparent"
                }`}
              />
              {item.icon(active)}
              <span
                className={`text-[10px] font-black uppercase tracking-wider ${
                  active ? "text-yellow-400" : "text-gray-600"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer for iOS home indicator */}
      <div className="h-safe-area-inset-bottom bg-black" style={{ height: "env(safe-area-inset-bottom)" }} />
    </nav>
  );
}
