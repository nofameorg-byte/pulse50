"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/representatives", label: "Directory" },
  { href: "/trending", label: "Trending" },
  { href: "/now", label: "PulseNow" },
  { href: "/now/townhall", label: "TownHall" },
  { href: "/polls", label: "PulsePolls" },
  { href: "/login", label: "Account" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const current =
    NAV_ITEMS.find((item) => isActive(item.href))?.label || "Menu";

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/95 backdrop-blur-xl">
      {open && (
        <div className="border-b border-white/10 bg-black p-3">
          <div className="grid grid-cols-2 gap-2">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`border px-4 py-3 text-xs font-black uppercase tracking-wider transition ${
                    active
                      ? "bg-yellow-400 text-black border-yellow-400"
                      : "border-white/10 text-gray-400 hover:border-yellow-400 hover:text-yellow-400"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
            Pulse50 Navigation
          </p>
          <p className="text-sm font-black uppercase tracking-widest text-yellow-400">
            {current}
          </p>
        </div>

        <span className="text-yellow-400 text-2xl leading-none">
          {open ? "×" : "☰"}
        </span>
      </button>

      <div
        className="bg-black"
        style={{ height: "env(safe-area-inset-bottom)" }}
      />
    </nav>
  );
}