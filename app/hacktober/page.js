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
  Award,
  Gift,
  Play,
  Brain,
  MonitorSmartphone,
  Shield,
  Gamepad2,
  Globe,
} from "lucide-react";
import Image from "next/image";
import { pusherClient } from "@/lib/pusher";
import PlexusBackground from "@/components/background";

const subcommittees = [
  {
    name: "AI/ML",
    icon: Brain,
    repo: {
      name: "Enigma AIML25",
      url: "https://github.com/MU-Enigma/Enigma-AIML25",
    },
  },
  {
    name: "SysCom",
    icon: MonitorSmartphone,
    repo: {
      name: "Enigma SysCom",
      url: "https://github.com/MU-Enigma/Syscom-2025",
    },
  },
  {
    name: "CyberSec",
    icon: Shield,
    repo: {
      name: "Cybersecurity Challenge",
      url: "https://github.com/MU-Enigma/Enigma_CyberSec_2025",
    },
  },
  {
    name: "GameDev",
    icon: Gamepad2,
    repo: {
      name: "Hack-and-Slash Project",
      url: "https://github.com/MU-Enigma/GAMEDEV-2025",
    },
  },
  {
    name: "WebDev",
    icon: Globe,
    repo: {
      name: "Food Order React App",
      url: "https://github.com/MU-Enigma/Enigma-WebDev-FoodApp",
    },
  },
];

const LeaderboardCard = ({
  rank,
  user,
  prs,
  avatar,
  isSearchResult = false,
}) => (
  <motion.div
    className={`flex items-center gap-4 bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300 ${
      isSearchResult ? "ring-1 ring-orange-400/20 border-orange-400/20" : ""
    }`}
  >
    <div className="flex-shrink-0">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${
          rank === 1
            ? "bg-yellow-500/15 text-yellow-400"
            : rank === 2
            ? "bg-gray-400/15 text-gray-300"
            : rank === 3
            ? "bg-orange-500/15 text-orange-400"
            : "bg-white/5 text-gray-500"
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
      <h4 className="text-white font-medium text-sm truncate">{user}</h4>
      <p className="text-xs text-gray-500">{prs} PRs merged</p>
    </div>
    <div className="flex items-center gap-1">
      <GitMerge className="w-3 h-3 text-orange-400" />
      <span className="text-sm font-semibold text-orange-400">{prs}</span>
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
            <div className="col-span-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Rank
            </div>
            <div className="col-span-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Committee
            </div>
            <div
              className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-orange-400 transition-colors flex items-center gap-1"
              onClick={() => handleSort("mergedPRs")}
            >
              PRs Merged
              {sortBy === "mergedPRs" && (
                <span className="text-orange-400">
                  {sortOrder === "desc" ? "↓" : "↑"}
                </span>
              )}
            </div>
            <div
              className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-orange-400 transition-colors flex items-center gap-1"
              onClick={() => handleSort("totalContributors")}
            >
              Contributors
              {sortBy === "totalContributors" && (
                <span className="text-orange-400">
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
                          ? "bg-gray-400/15 text-gray-300"
                          : rank === 3
                          ? "bg-orange-500/15 text-orange-400"
                          : "bg-white/5 text-gray-500"
                      }`}
                    >
                      {rank}
                    </div>
                  </div>

                  {/* Committee */}
                  <div className="col-span-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                      <Icon className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-base">
                        {committee.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">
                        {committee.repo.name}
                      </p>
                    </div>
                  </div>

                  {/* PRs Merged */}
                  <div className="col-span-2">
                    <motion.div
                      key={committee.mergedPRs}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className="text-2xl font-bold text-orange-400"
                    >
                      {committee.mergedPRs}
                    </motion.div>
                  </div>

                  {/* Contributors */}
                  <div className="col-span-2">
                    <div className="text-2xl font-bold text-orange-400">
                      {committee.totalContributors}
                    </div>
                  </div>

                  {/* Repository Link */}
                  <div className="col-span-1 flex justify-end">
                    <a
                      href={committee.repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-white/[0.02] hover:bg-orange-500/10 border border-white/[0.04] hover:border-orange-500/20 rounded-lg flex items-center justify-center text-gray-400 hover:text-orange-400 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105"
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
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Click column headers to sort</span>
            <span>Updated in real-time</span>
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
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                : "bg-white/[0.05] text-gray-400 border border-white/[0.08]"
            }`}
          >
            PRs {sortBy === "mergedPRs" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
          <button
            onClick={() => handleSort("totalContributors")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              sortBy === "totalContributors"
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                : "bg-white/[0.05] text-gray-400 border border-white/[0.08]"
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
                      ? "bg-gray-400/15 text-gray-300"
                      : rank === 3
                      ? "bg-orange-500/15 text-orange-400"
                      : "bg-white/5 text-gray-500"
                  }`}
                >
                  {rank}
                </div>
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-base truncate">
                    {committee.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono truncate">
                    {committee.repo.name}
                  </p>
                </div>
                <a
                  href={committee.repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-white/[0.02] hover:bg-orange-500/10 border border-white/[0.04] hover:border-orange-500/20 rounded-lg flex items-center justify-center text-gray-400 hover:text-orange-400 transition-all duration-200 hover:scale-105 flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <motion.div
                    key={committee.mergedPRs}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-orange-400 mb-1"
                  >
                    {committee.mergedPRs}
                  </motion.div>
                  <div className="text-xs text-gray-500 font-medium">
                    PRs Merged
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400 mb-1">
                    {committee.totalContributors}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    Contributors
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Mobile Footer */}
        <div className="text-center text-xs text-gray-500 pt-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <span>Updated in real-time</span>
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
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLeaderboard, setFilteredLeaderboard] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/hacktober-stats");
        const data = await response.json();
        setLeaderboardData(data.leaderboard || []);
        setCommitteeStats(data.committees || []);
        setRecentActivity(data.recentActivity || []);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

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

    channel.bind("pr-merged", (data) => {
      console.log("PR merged (real-time):", data);
      fetchStats();
    });

    channel.bind("stats-update", (data) => {
      console.log("Stats update triggered:", data);
      fetchStats();
    });

    return () => {
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
    <div className="min-h-screen bg-transparent text-white">
      <HeroHeader />
      <PlexusBackground />

      <section className="h-[60vh] md:h-screen relative flex items-end">
        <Image
          src="/hacktober.png"
          alt="Hacktober 2025"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Enhanced gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-40 md:h-48 bg-gradient-to-t from-black via-black/90 to-transparent"></div>
      </section>

      <main className="relative">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <section className="md:pt-5 pb-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                What is Hacktoberfest?
              </h2>
            </div>
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-xl text-gray-300 leading-relaxed mb-6">
                Hacktoberfest is a month-long celebration of open source
                software run by DigitalOcean. During October, we encourage you
                to join the developer community by contributing to open-source
                projects.
              </p>
              <p className="text-xl text-gray-300 leading-relaxed">
                At Enigma, we participate by maintaining repositories across our
                5 subcommittees, giving you the opportunity to contribute to
                real projects and learn new technologies.
              </p>
            </div>
          </section>

          <section className="pb-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                How to Contribute
              </h2>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                {[
                  {
                    num: "1",
                    title: "Register",
                    desc: (
                      <>
                        Sign up on{" "}
                        <a
                          href="https://hacktoberfest.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-400 underline hover:text-orange-300 transition-colors"
                        >
                          hacktoberfest.com
                        </a>
                      </>
                    ),
                  },
                  {
                    num: "2",
                    title: "Fork",
                    desc: "Choose a repository from our committees",
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
                    <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                      {step.num}
                    </div>
                    <h3 className="text-white font-semibold mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    Quick Start Commands
                  </h3>
                </div>
                <pre className="text-sm text-gray-300 leading-relaxed overflow-x-auto font-mono">
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
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                How-to Videos
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Watch these tutorial to get started with Git, GitHub, and making
                your first contribution.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                    <Play className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white">
                    Git & GitHub Basics
                  </h3>
                </div>

                <div className="aspect-video rounded-2xl overflow-hidden bg-gray-900/50">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/vA5TTz6BXhY?si=sfFlmuxVWSKplWof"
                    title="YouTube video player"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allowfullscreen
                  ></iframe>
                </div>
              </div>
            </div>
          </section>

          <section className="pb-24">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-6">
                <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                  Live Dashboard
                </h2>
                {isConnected && (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mt-2"></div>
                )}
              </div>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
                Real-time leaderboard and activity feed from all repositories
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">
                      Top Contributors
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-500">
                        Live updates
                      </span>
                    </div>
                  </div>

                  {/* Search Box */}
                  {leaderboardData.length >= 0 && (
                    <div className="mb-4">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="w-4 h-4 text-gray-500" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search contributors..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/20 transition-all duration-300"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {searchQuery && (
                        <p className="text-xs text-gray-500 mt-2">
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
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-400 border-t-transparent"></div>
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
                        <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">
                          No contributors found
                        </h3>
                        <p className="text-gray-500">
                          Try searching with a different username
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">
                          No contributions yet
                        </h3>
                        <p className="text-gray-500">
                          Be the first to make a contribution!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Recent Activity */}
                <div className="space-y-6 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">
                      Recent Activity
                    </h3>
                    <div className="flex items-center gap-2">
                      <GitMerge className="w-4 h-4 text-orange-400" />
                      <span className="text-xs text-gray-500">
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
                                <span className="text-white font-medium text-sm">
                                  {activity.user}
                                </span>
                                <span className="text-gray-500 text-xs">
                                  {activity.action}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-orange-400 font-medium">
                                  {activity.repo}
                                </span>
                                <span className="text-xs text-gray-600">•</span>
                                <span className="text-xs text-gray-500">
                                  {activity.time}
                                </span>
                              </div>
                              {activity.title && (
                                <p className="text-xs text-gray-600 mt-1 truncate">
                                  {activity.title}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <GitMerge className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">
                          No recent activity
                        </h3>
                        <p className="text-gray-500 text-sm">
                          PR merges will appear here in real-time
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
                <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  Committee Leaderboard
                </h2>
              </div>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Real-time rankings based on merged PRs and contributor activity
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <CommitteeTable
                committees={subcommittees.map((committee) => ({
                  ...committee,
                  ...(committeeStats.find(
                    (stat) => stat.name === committee.name
                  ) || { mergedPRs: 0, totalContributors: 0 }),
                }))}
                loading={loading}
              />
            </div>
          </section>

          <section className="pb-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                Rewards & Incentives
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-8 text-center hover:bg-white/[0.04] transition-all duration-300">
                <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  Digital Holopins
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Earn exclusive digital badges from DigitalOcean for your
                  contributions and showcase your achievements.
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-8 text-center hover:bg-white/[0.04] transition-all duration-300">
                <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Gift className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  Exclusive Merch
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Get limited edition Enigma Hacktoberfest merchandise for
                  quality contributions and stand out!
                </p>
              </div>
            </div>
          </section>

          <section className="pb-24">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-gradient-to-r from-orange-500/5 to-red-500/5 border border-orange-500/20 rounded-3xl p-12">
                <h3 className="text-3xl font-bold text-white mb-6">
                  Ready to contribute?
                </h3>
                <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                  Pick a repository and be part of the open source community.
                </p>
                <a
                  href="https://github.com/MU-Enigma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-orange-500 hover:bg-orange-600 rounded-2xl text-white font-semibold text-lg transition-all duration-300 hover:scale-105"
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
