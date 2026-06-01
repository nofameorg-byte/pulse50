"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function HorizontalScroller({
  children,
}: {
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({
      left: -400,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({
      left: 400,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {/* Desktop Left Arrow */}
      <button
        onClick={scrollLeft}
        className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-full border border-yellow-400/40 bg-black/90 text-yellow-400 hover:bg-yellow-400 hover:text-black transition"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Desktop Right Arrow */}
      <button
        onClick={scrollRight}
        className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-full border border-yellow-400/40 bg-black/90 text-yellow-400 hover:bg-yellow-400 hover:text-black transition"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Scroll Area */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}