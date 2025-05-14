"use client";
import React from "react";

export default function SaleBanner() {
  return (
    <div className="w-full bg-black/30% py-3 overflow-hidden mt-32">
      <div className="flex whitespace-nowrap animate-marquee text-black uppercase font-bold text-lg tracking-[2px] opacity-60">
        {[...Array(6)].map((_, i) => (
          <p key={i} className="mx-8">SOLDES – BLUE GATE -30% -40% -50% -60%</p>
        ))}
      </div>
    </div>
  );
}
