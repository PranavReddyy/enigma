"use client";

import { useState } from "react";
import Link from "next/link";
import { Win98Button } from "@/components/ui/win-98-button";

export default function NotFound() {
  const [counter, setCounter] = useState(0);

  const increment = () => {
    if (counter < 649) {
      setCounter(counter + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#c0c0c0] flex items-center justify-center p-4 font-mono">
      <div className="bg-[#c0c0c0] border-2 border-b-[#808080] border-r-[#808080] border-t-white border-l-white p-6 max-w-md w-full">
        {/* Title Bar */}
        <div className="bg-[#0000ff] text-white px-2 py-1 mb-4 flex items-center justify-between text-sm font-bold">
          <span>Error - 404.exe</span>
          <div className="flex gap-1">
            <div className="w-4 h-3 bg-[#c0c0c0] border border-[#808080] flex items-center justify-center text-[8px] text-black">
              ×
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-3">
            {/* Enigma Logo */}
            <div className="relative">
              <div className="w-12 h-12 border-2 border-b-[#808080] border-r-[#808080] border-t-white border-l-white bg-[#c0c0c0] flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Enigma Logo"
                  className="w-8 h-8 object-contain"
                  draggable={false}
                />
              </div>
              <a
                href="https://itsbypranav.com"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 opacity-0 cursor-default"
                aria-hidden="true"
                tabIndex={-1}
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-black">Page Not Found</h1>
              <p className="text-sm text-black">404 Error</p>
            </div>
          </div>

          {/* Counter Display */}
          <div className="border-2 border-b-white border-r-white border-t-[#808080] border-l-[#808080] bg-white p-4">
            <div className="text-4xl font-bold text-black font-mono tracking-wider mb-2">
              {counter.toString().padStart(3, "0")}
            </div>
            <div className="text-xs text-gray-600">
              {counter >= 649 ? "MAX REACHED" : "Keep clicking"}
            </div>
          </div>

          {/* Increment Button */}
          <Win98Button
            onClick={increment}
            disabled={counter >= 649}
            className="text-sm px-6 py-2"
          >
            {counter >= 649 ? "MAXED OUT" : "Click Me!"}
          </Win98Button>

          {/* Home Button */}
          <div className="pt-4 border-t border-[#808080]">
            <Link href="/">
              <Win98Button className="text-sm px-6 py-2">Go Home</Win98Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
