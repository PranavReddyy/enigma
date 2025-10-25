"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, GitCommit } from "lucide-react";

const updates = [
  {
    version: "v1.01",
    date: "Oct 25, 2024",
    items: [
      "Hacktober Stats fix (Stats are godly, great job y'all)",
      "Added mobile CLI support",
      "New terminal commands",
    ],
  },
  {
    version: "v1.0",
    date: "Sep 22, 2024",
    items: ["Initial public release", "Core features and design"],
  },
];

export function ChangelogSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between group hover:opacity-80 transition-opacity py-2 -mx-2 px-2 rounded active:bg-slate-900/20"
        >
          <div className="flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-400">Changelog</span>
            <span className="text-xs text-slate-600 font-mono">
              {updates[0].version}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-4 max-h-64 sm:max-h-80 overflow-y-auto pr-2 -mr-2">
                {updates.map((update) => (
                  <div
                    key={update.version}
                    className="border-l border-slate-800 pl-3 sm:pl-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-2">
                      <span className="text-sm font-mono text-slate-300">
                        {update.version}
                      </span>
                      <span className="text-xs text-slate-600">
                        {update.date}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {update.items.map((item, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-500 flex items-start gap-2"
                        >
                          <span className="text-slate-700 mt-0.5 flex-shrink-0">
                            •
                          </span>
                          <span className="break-words">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* GitHub Link */}
              <a
                href="https://github.com/PranavReddyy/enigma"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 pt-3 border-t border-slate-800/50 text-xs text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1.5 active:text-slate-300"
              >
                <GitCommit className="w-3 h-3" />
                View on GitHub
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
