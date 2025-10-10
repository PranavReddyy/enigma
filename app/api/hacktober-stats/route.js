import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

const ORG_NAME = "MU-Enigma";

const REPO_COMMITTEE_MAP = {
  "Enigma-AIML25": "AI/ML",
  "Syscom-2025": "SysCom",
  "Enigma_CyberSec_2025": "Cyber",
  "GAMEDEV-2025": "GameDev",
  "Enigma-WebDev-FoodApp": "WebDev",
};

const REPOS = Object.keys(REPO_COMMITTEE_MAP);

export async function GET() {
  try {
    const leaderboard = new Map();
    const committeeStats = new Map();
    const recentActivity = [];

    const committees = [...new Set(Object.values(REPO_COMMITTEE_MAP))];
    committees.forEach((committee) => {
      committeeStats.set(committee, {
        name: committee,
        mergedPRs: 0,
        totalContributors: new Set(),
      });
    });

    for (const repoName of REPOS) {
      try {
        const { data: prs } = await octokit.rest.pulls.list({
          owner: ORG_NAME,
          repo: repoName,
          state: "closed",
          per_page: 100,
          sort: "updated",
          direction: "desc",
        });

        const mergedPrs = prs.filter((pr) => pr.merged_at);
        const committeeName = REPO_COMMITTEE_MAP[repoName];
        const stats = committeeStats.get(committeeName);

        if (stats) {
          stats.mergedPRs += mergedPrs.length;

          mergedPrs.forEach((pr) => {
            const username = pr.user.login;
            const avatar = pr.user.avatar_url;

            if (leaderboard.has(username)) {
              leaderboard.get(username).mergedPRs++;
            } else {
              leaderboard.set(username, {
                username,
                mergedPRs: 1,
                avatar,
              });
            }

            stats.totalContributors.add(username);

            recentActivity.push({
              user: username,
              repo: committeeName,
              time: getTimeAgo(new Date(pr.merged_at)),
              action: "merged PR",
              avatar: avatar,
              title: pr.title,
              timestamp: new Date(pr.merged_at),
            });
          });
        }
      } catch (error) {
        console.error(
          `Error fetching data for ${ORG_NAME}/${repoName}:`,
          error
        );
      }
    }

    const sortedRecentActivity = recentActivity
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    const leaderboardArray = Array.from(leaderboard.values()).sort(
      (a, b) => b.mergedPRs - a.mergedPRs
    );

    const committeeStatsArray = Array.from(committeeStats.values()).map(
      (stats) => ({
        ...stats,
        totalContributors: stats.totalContributors.size,
      })
    );

    return NextResponse.json({
      leaderboard: leaderboardArray,
      committees: committeeStatsArray,
      recentActivity: sortedRecentActivity,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats", details: error.message },
      { status: 500 }
    );
  }
}
