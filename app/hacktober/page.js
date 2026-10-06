"use client";

import { useState, useEffect } from "react";
import { Trophy, Users, GitPullRequest, Star, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { HeroHeader } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";
import {
  GitFork,
  GitMerge,
  ExternalLink,
  Code2,
  Gift,
  Play,
  Brain,
  MonitorSmartphone,
  Gamepad2,
  Globe,
  Sigma,
} from "lucide-react";
import Image from "next/image";
import { pusherClient } from "@/lib/pusher";
import PlexusBackground from "@/components/background";
import { HACKTOBER_COMMITTEES, HACKTOBER_ORG } from "@/lib/hacktober-repositories";

const committeeIcons = { "AI/ML": Brain, SysCom: MonitorSmartphone, GameDev: Gamepad2, WebDev: Globe, "Theoretical & Math": Sigma };
const subcommittees = HACKTOBER_COMMITTEES.map(({ name, repoName }) => ({
  name,
  icon: committeeIcons[name],
  repo: { name: repoName, url: `https://github.com/${HACKTOBER_ORG}/${repoName}` },
}));

const LeaderboardCard = ({
  rank,
  user,
  prs,
  avatar,
  isSearchResult = false,
}) => (
  <motion.div
    className={`flex items-center gap-4 bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300 ${
      isSearchResult ? "ring-1 ring-[#67DBE5]/20 border-[#67DBE5]/20" : ""
    }`}
  >
    <div className="flex-shrink-0">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${
          rank === 1
            ? "bg-yellow-500/15 text-yellow-400"
            : rank === 2
            ? "bg-gray-400/15 text-cyan-100/80"
            : rank === 3
            ? "bg-orange-500/15 text-orange-400"
            : "bg-white/5 text-cyan-200/60"
        }`}
      >
        {rank}
      </div>
    </div>
    {avatar && (
      <img
        src={avatar}
        alt={user}
        className="w-8 h-8 rounded-lg border border-white/10"
      />
    )}
    <div className="flex-1 min-w-0">
      <h4 className="text-cyan-100 font-medium text-sm truncate">{user}</h4>
      <p className="text-xs text-cyan-200/60">{prs} PRs merged</p>
    </div>
    <div className="flex items-center gap-1">
      <GitMerge className="w-3 h-3 text-[#67DBE5]" />
      <span className="text-sm font-semibold text-[#67DBE5]">{prs}</span>
    </div>
  </motion.div>
);

const CommitteeTable = ({ committees, loading }) => {
  const [sortBy, setSortBy] = useState("mergedPRs");
  const [sortOrder, setSortOrder] = useState("desc");

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const sortedCommittees = [...committees].sort((a, b) => {
    const aValue = sortBy === "mergedPRs" ? a.mergedPRs : a.totalContributors;
    const bValue = sortBy === "mergedPRs" ? b.mergedPRs : b.totalContributors;

    if (sortOrder === "desc") {
      return bValue - aValue;
    }
    return aValue - bValue;
  });

  if (loading) {
    return (
      <>
        {/* Desktop Loading */}
        <div className="hidden md:block bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-800 rounded"></div>
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="h-16 bg-gray-800 rounded"></div>
                ))}
            </div>
          </div>
        </div>

        {/* Mobile Loading */}
        <div className="md:hidden space-y-4">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gray-800 rounded-xl"></div>
                  <div className="w-10 h-10 bg-gray-800 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-800 rounded mb-1"></div>
                    <div className="h-3 bg-gray-800 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-8 bg-gray-800 rounded"></div>
                  <div className="h-8 bg-gray-800 rounded"></div>
                </div>
              </div>
            ))}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden md:block bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden"
      >
        {/* Table Header */}
        <div className="bg-white/[0.03] border-b border-white/[0.08] px-6 py-4">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-1 text-xs font-semibold text-cyan-200/60 uppercase tracking-wider">
              Rank
            </div>
            <div className="col-span-6 text-xs font-semibold text-cyan-200/60 uppercase tracking-wider">
              Committee
            </div>
            <div
              className="col-span-2 text-xs font-semibold text-cyan-200/60 uppercase tracking-wider cursor-pointer hover:text-[#67DBE5] transition-colors flex items-center gap-1"
              onClick={() => handleSort("mergedPRs")}
            >
              PRs Merged
              {sortBy === "mergedPRs" && (
                <span className="text-[#67DBE5]">
                  {sortOrder === "desc" ? "↓" : "↑"}
                </span>
              )}
            </div>
            <div
              className="col-span-2 text-xs font-semibold text-cyan-200/60 uppercase tracking-wider cursor-pointer hover:text-[#67DBE5] transition-colors flex items-center gap-1"
              onClick={() => handleSort("totalContributors")}
            >
              Contributors
              {sortBy === "totalContributors" && (
                <span className="text-[#67DBE5]">
                  {sortOrder === "desc" ? "↓" : "↑"}
                </span>
              )}
            </div>
            <div className="col-span-1"></div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-white/[0.05]">
          {sortedCommittees.map((committee, index) => {
            const rank = index + 1;
            const Icon = committee.icon;

            return (
              <motion.div
                key={committee.name}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="px-6 py-5 hover:bg-white/[0.02] transition-all duration-200 group"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Rank */}
                  <div className="col-span-1">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                        rank === 1
                          ? "bg-yellow-500/15 text-yellow-400"
                          : rank === 2
                          ? "bg-gray-400/15 text-cyan-100/80"
                          : rank === 3
                          ? "bg-orange-500/15 text-orange-400"
                          : "bg-white/5 text-cyan-200/60"
                      }`}
                    >
                      {rank}
                    </div>
                  </div>

                  {/* Committee */}
                  <div className="col-span-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#67DBE5]/10 rounded-xl flex items-center justify-center group-hover:bg-[#67DBE5]/20 transition-colors">
                      <Icon className="w-5 h-5 text-[#67DBE5]" />
                    </div>
                    <div>
                      <h3 className="text-cyan-100 font-semibold text-base">
                        {committee.name}
                      </h3>
                      <p className="text-xs text-cyan-200/60 font-mono">
                        {committee.repo.name}
                      </p>
                    </div>
                  </div>

                  {/* PRs Merged */}
                  <div className="col-span-2">
                    <motion.div
                      key={committee.available === false ? "—" : committee.mergedPRs}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className="text-2xl font-bold text-[#67DBE5]"
                    >
                      {committee.available === false ? "—" : committee.mergedPRs}
                    </motion.div>
                  </div>

                  {/* Contributors */}
                  <div className="col-span-2">
                    <div className="text-2xl font-bold text-[#67DBE5]">
                      {committee.available === false ? "—" : committee.totalContributors}
                    </div>
                  </div>

                  {/* Repository Link */}
                  <div className="col-span-1 flex justify-end">
                    <a
                      href={committee.repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-white/[0.02] hover:bg-[#67DBE5]/10 border border-white/[0.04] hover:border-[#67DBE5]/20 rounded-lg flex items-center justify-center text-cyan-200/70 hover:text-[#67DBE5] transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-white/[0.03] border-t border-white/[0.08] px-6 py-4">
          <div className="flex items-center justify-between text-xs text-cyan-200/60">
            <span>Click column headers to sort</span>
            <span>Refreshes automatically every minute</span>
          </div>
        </div>
      </motion.div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {/* Mobile Sort Controls */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleSort("mergedPRs")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              sortBy === "mergedPRs"
                ? "bg-[#67DBE5]/20 text-[#67DBE5] border border-[#67DBE5]/30"
                : "bg-white/[0.05] text-cyan-200/70 border border-white/[0.08]"
            }`}
          >
            PRs {sortBy === "mergedPRs" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
          <button
            onClick={() => handleSort("totalContributors")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              sortBy === "totalContributors"
                ? "bg-[#67DBE5]/20 text-[#67DBE5] border border-[#67DBE5]/30"
                : "bg-white/[0.05] text-cyan-200/70 border border-white/[0.08]"
            }`}
          >
            Contributors{" "}
            {sortBy === "totalContributors" &&
              (sortOrder === "desc" ? "↓" : "↑")}
          </button>
        </div>

        {/* Mobile Committee Cards */}
        {sortedCommittees.map((committee, index) => {
          const rank = index + 1;
          const Icon = committee.icon;

          return (
            <motion.div
              key={committee.name}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 hover:bg-white/[0.04] transition-all duration-200"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    rank === 1
                      ? "bg-yellow-500/15 text-yellow-400"
                      : rank === 2
                      ? "bg-gray-400/15 text-cyan-100/80"
                      : rank === 3
                      ? "bg-orange-500/15 text-orange-400"
                      : "bg-white/5 text-cyan-200/60"
                  }`}
                >
                  {rank}
                </div>
                <div className="w-10 h-10 bg-[#67DBE5]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#67DBE5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-cyan-100 font-semibold text-base truncate">
                    {committee.name}
                  </h3>
                  <p className="text-xs text-cyan-200/60 font-mono truncate">
                    {committee.repo.name}
                  </p>
                </div>
                <a
                  href={committee.repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-white/[0.02] hover:bg-[#67DBE5]/10 border border-white/[0.04] hover:border-[#67DBE5]/20 rounded-lg flex items-center justify-center text-cyan-200/70 hover:text-[#67DBE5] transition-all duration-200 hover:scale-105 flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <motion.div
                    key={committee.available === false ? "—" : committee.mergedPRs}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-[#67DBE5] mb-1"
                  >
                    {committee.available === false ? "—" : committee.mergedPRs}
                  </motion.div>
                  <div className="text-xs text-cyan-200/60 font-medium">
                    PRs Merged
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#67DBE5] mb-1">
                    {committee.available === false ? "—" : committee.totalContributors}
                  </div>
                  <div className="text-xs text-cyan-200/60 font-medium">
                    Contributors
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Mobile Footer */}
        <div className="text-center text-xs text-cyan-200/60 pt-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <span>Refreshes automatically every minute</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default function HacktoberPage() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [committeeStats, setCommitteeStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsUnavailable, setStatsUnavailable] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLeaderboard, setFilteredLeaderboard] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/hacktober-stats", { cache: "no-store" });
        const data = await response.json();
        setStatsUnavailable(!response.ok || data.partial === true);
        setLeaderboardData(data.leaderboard || []);
        setCommitteeStats(data.committees || []);
        setRecentActivity(data.recentActivity || []);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStatsUnavailable(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    const refreshTimer = setInterval(fetchStats, 60000);
    if (!pusherClient) return () => clearInterval(refreshTimer);

    const channel = pusherClient.subscribe("hacktober-stats");

    channel.bind("pusher:subscription_succeeded", () => {
      setIsConnected(true);
      console.log("Connected to real-time updates");
    });

    channel.bind("pr-merged", (data) => {
      console.log("PR merged (real-time):", data);
      setRecentActivity((prev) => [
        {
          user: data.user,
          repo: data.committee,
          time: "just now",
          action: "merged PR",
          avatar: data.avatar,
          title: data.title,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]);
      fetchStats();
    });



    channel.bind("stats-update", (data) => {
      console.log("Stats update triggered:", data);
      fetchStats();
    });

    return () => {
      clearInterval(refreshTimer);
      pusherClient.unsubscribe("hacktober-stats");
      setIsConnected(false);
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredLeaderboard(leaderboardData);
    } else {
      const filtered = leaderboardData.filter((user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLeaderboard(filtered);
    }
  }, [searchQuery, leaderboardData]);

  return (
    <div className="min-h-screen bg-transparent text-cyan-100">
      <HeroHeader />
      <PlexusBackground color="52, 147, 155" />

      <section className="relative mx-auto mt-24 mb-10 h-[clamp(22rem,65vw,42rem)] w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Image
              src="/hacktober-2026-clean.png"
          alt="Hacktober 2026"
          fill
          className="object-contain object-center"
          sizes="(min-width: 1280px) 1280px, 100vw"
          priority
        />
        {/* Enhanced gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none h-16 md:h-24 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
      </section>

      <main className="relative">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <section className="md:pt-5 pb-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-[#67DBE5]">
                What is Hacktoberfest?
              </h2>
            </div>
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-xl text-cyan-100/80 leading-relaxed mb-6">
                Hacktoberfest is a month-long celebration of open source
                software. Throughout October 2026, join the developer community
                by contributing to open-source projects.
              </p>
              <p className="text-xl text-cyan-100/80 leading-relaxed">
                Enigma&apos;s 2026 edition brings together repositories from five
                subcommittees, giving you the opportunity to ship meaningful
                contributions and learn new technologies.
              </p>
            </div>
          </section>

          <section className="pb-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-[#67DBE5]">
                How to Contribute
              </h2>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                {[
                  {
                    num: "1",
                    title: "Choose",
                    desc: (
                      <>
                        Pick a repository from the domain of your interest!{" "}
                        <a
                          href="https://github.com/MU-Enigma"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#67DBE5] underline hover:text-[#67DBE5] transition-colors"
                        >
                          Explore our GitHub
                        </a>
                      </>
                    ),
                  },
                  {
                    num: "2",
                    title: "Fork",
                    desc: "Fork your chosen repository on GitHub",
                  },
                  {
                    num: "3",
                    title: "Code",
                    desc: "Clone locally and make changes",
                  },
                  {
                    num: "4",
                    title: "Submit",
                    desc: "Push changes and create a PR",
                  },
                ].map((step, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-[#67DBE5] rounded-2xl flex items-center justify-center text-slate-950 text-xl font-bold mx-auto mb-4">
                      {step.num}
                    </div>
                    <h3 className="text-cyan-100 font-semibold mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-cyan-200/60 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#67DBE5]/10 rounded-xl flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-[#67DBE5]" />
                  </div>
                  <h3 className="text-xl font-semibold text-cyan-100">
                    Quick Start Commands
                  </h3>
                </div>
                <pre className="text-sm text-cyan-100/80 leading-relaxed overflow-x-auto font-mono">
                  {`# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/REPO_NAME.git

cd REPO_NAME

# 3. Create a new branch
git checkout -b feature/your-feature-name

# 4. Make your changes, then stage and commit
git add .
git commit -m "Add your descriptive commit message"

# 5. Push your branch to your fork
git push origin feature/your-feature-name

# 6. Open a Pull Request on GitHub`}
                </pre>
              </div>
            </div>
          </section>

          <section className="pb-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-[#67DBE5]">
                How-to Videos
              </h2>
              <p className="text-xl text-cyan-100/80 max-w-2xl mx-auto">
                Watch this tutorial to get started with Git, GitHub, and make
                your first contribution in 2026.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-[#67DBE5]/10 rounded-2xl flex items-center justify-center">
                    <Play className="w-6 h-6 text-[#67DBE5]" />
                  </div>
                  <h3 className="text-2xl font-semibold text-cyan-100">
                    Git & GitHub Basics
                  </h3>
                </div>

                <div className="aspect-video rounded-2xl overflow-hidden bg-gray-900/50">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/vA5TTz6BXhY?si=sfFlmuxVWSKplWof"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          </section>

          <section className="pb-24">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-6">
                <h2 className="text-4xl lg:text-5xl font-bold text-[#67DBE5]">
                  Live Dashboard
                </h2>
                {isConnected && (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mt-2"></div>
                )}
              </div>
              <p className="text-lg text-cyan-200/70 max-w-2xl mx-auto mb-8">
                Merged pull requests and contributors across all five repositories
              </p>
            </div>

            {statsUnavailable && (
              <p role="status" className="mb-6 rounded-xl border border-cyan-300/20 bg-cyan-300/5 px-5 py-4 text-sm text-cyan-100/80">
                Some repository data is unavailable. Rankings may be incomplete; unavailable counts are not confirmed zeros.
              </p>
            )}
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-cyan-100">
                      Top Contributors
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-cyan-300/60"}`}></div>
                      <span className="text-xs text-cyan-200/60">
                        {isConnected ? "Live updates" : "Refreshes every minute"}
                      </span>
                    </div>
                  </div>

                  {/* Search Box */}
                  {leaderboardData.length >= 0 && (
                    <div className="mb-4">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="w-4 h-4 text-cyan-200/60" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search contributors..."
                          aria-label="Search contributors"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl text-cyan-100 placeholder-cyan-200/50 focus:outline-none focus:border-[#67DBE5]/50 focus:ring-1 focus:ring-[#67DBE5]/20 transition-all duration-300"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-cyan-200/60 hover:text-cyan-100/80 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {searchQuery && (
                        <p className="text-xs text-cyan-200/60 mt-2">
                          {filteredLeaderboard.length} contributor
                          {filteredLeaderboard.length !== 1 ? "s" : ""} found
                        </p>
                      )}
                    </div>
                  )}

                  {/* Leaderboard */}
                  <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-2">
                    {loading ? (
                      <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#67DBE5] border-t-transparent"></div>
                      </div>
                    ) : filteredLeaderboard.length > 0 ? (
                      <div className="space-y-1 h-80 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 px-2">
                        {filteredLeaderboard.map((user, index) => {
                          const originalRank =
                            leaderboardData.findIndex(
                              (u) => u.username === user.username
                            ) + 1;
                          const isSearchResult =
                            searchQuery.trim() !== "" &&
                            user.username
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase());

                          return (
                            <LeaderboardCard
                              key={user.username}
                              rank={originalRank}
                              user={user.username}
                              prs={user.mergedPRs}
                              avatar={user.avatar}
                              isSearchResult={isSearchResult}
                            />
                          );
                        })}
                      </div>
                    ) : searchQuery.trim() !== "" ? (
                      <div className="text-center py-16">
                        <Search className="w-12 h-12 text-cyan-200/50 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-cyan-100 mb-2">
                          No contributors found
                        </h3>
                        <p className="text-cyan-200/60">
                          Try searching with a different username
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <Trophy className="w-12 h-12 text-cyan-200/50 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-cyan-100 mb-2">
                          {statsUnavailable ? "Contribution data unavailable" : "No contributions yet"}
                        </h3>
                        <p className="text-cyan-200/60">
                          {statsUnavailable ? "Repository data will refresh automatically." : "Be the first to make a contribution!"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Recent Activity */}
                <div className="space-y-6 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-cyan-100">
                      Recent Activity
                    </h3>
                    <div className="flex items-center gap-2">
                      <GitMerge className="w-4 h-4 text-[#67DBE5]" />
                      <span className="text-xs text-cyan-200/60">
                        Latest merges
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 h-[400px] overflow-hidden">
                    {loading ? (
                      <div className="space-y-4 animate-pulse">
                        {Array(6)
                          .fill(0)
                          .map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-800 rounded-lg"></div>
                              <div className="flex-1">
                                <div className="h-4 bg-gray-800 rounded mb-1"></div>
                                <div className="h-3 bg-gray-800 rounded w-2/3"></div>
                              </div>
                              <div className="w-16 h-6 bg-gray-800 rounded"></div>
                            </div>
                          ))}
                      </div>
                    ) : recentActivity.length > 0 ? (
                      <div className="space-y-4 h-full overflow-y-auto scrollbar-thin scrollbar-track-gray-800/20 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 pr-2">
                        {recentActivity.map((activity, index) => (
                          <motion.div
                            key={`${activity.user}-${
                              activity.timestamp || index
                            }`}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors flex-shrink-0"
                          >
                            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <GitMerge className="w-4 h-4 text-green-400" />
                            </div>
                            {activity.avatar && (
                              <img
                                src={activity.avatar}
                                alt={activity.user}
                                className="w-8 h-8 rounded-lg border border-white/10 flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-cyan-100 font-medium text-sm">
                                  {activity.user}
                                </span>
                                <span className="text-cyan-200/60 text-xs">
                                  {activity.action}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-[#67DBE5] font-medium">
                                  {activity.repo}
                                </span>
                                <span className="text-xs text-cyan-200/50">•</span>
                                <span className="text-xs text-cyan-200/60">
                                  {activity.time}
                                </span>
                              </div>
                              {activity.title && (
                                <p className="text-xs text-cyan-200/50 mt-1 truncate">
                                  {activity.title}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <GitMerge className="w-12 h-12 text-cyan-200/50 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-cyan-100 mb-2">
                          No recent activity
                        </h3>
                        <p className="text-cyan-200/60 text-sm">
                          Merged PRs appear here after the next automatic refresh
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Committee Stats */}
          <section className="pb-24">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-6">
                <h2 className="text-4xl lg:text-5xl font-bold text-[#67DBE5]">
                  Committee Leaderboard
                </h2>
              </div>
              <p className="text-lg text-cyan-200/70 max-w-2xl mx-auto">
                Rankings based on merged PRs, refreshed automatically every minute
              </p>
            </div>

            {statsUnavailable && (
              <p role="status" className="mb-6 rounded-xl border border-cyan-300/20 bg-cyan-300/5 px-5 py-4 text-sm text-cyan-100/80">
                Some repository data is unavailable. Rankings may be incomplete; unavailable counts are not confirmed zeros.
              </p>
            )}
            <div className="max-w-6xl mx-auto">
              <CommitteeTable
                committees={subcommittees.map((committee) => ({
                  ...committee,
                  ...(committeeStats.find(
                    (stat) => stat.name === committee.name
                  ) || { mergedPRs: 0, totalContributors: 0, available: false }),
                }))}
                loading={loading}
              />
            </div>
          </section>

          <section className="pb-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-[#67DBE5]">
                Rewards & Incentives
              </h2>
            </div>

            <div className="max-w-xl mx-auto">

              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-8 text-center hover:bg-white/[0.04] transition-all duration-300">
                <div className="w-16 h-16 bg-[#67DBE5]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Gift className="w-8 h-8 text-[#67DBE5]" />
                </div>
                <h3 className="text-xl font-semibold text-cyan-100 mb-4">
                  Enigma 2026 Merch
                </h3>
                <p className="text-cyan-100/80 leading-relaxed">
                  Earn limited-edition Enigma Hacktober 2026 merchandise for
                  thoughtful, high-quality contributions.
                </p>
              </div>
            </div>
          </section>

          <section className="pb-24">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-gradient-to-r from-[#67DBE5]/5 to-[#42BAC7]/5 border border-[#67DBE5]/20 rounded-3xl p-12">
                <h3 className="text-3xl font-bold text-cyan-100 mb-6">
                  Ready to contribute in 2026?
                </h3>
                <p className="text-xl text-cyan-100/80 mb-10 max-w-2xl mx-auto">
                  Pick a repository and be part of the open source community.
                </p>
                <a
                  href="https://github.com/MU-Enigma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-[#67DBE5] hover:bg-[#42BAC7] rounded-2xl text-slate-950 font-semibold text-lg transition-all duration-300 hover:scale-105"
                >
                  <GitFork className="w-5 h-5" />
                  View All Repositories
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
