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
  Enigma_CyberSec_2025: "CyberSec",
  "GAMEDEV-2025": "GameDev",
  "Enigma-WebDev-FoodApp": "WebDev",
};

const REPOS = Object.keys(REPO_COMMITTEE_MAP);

// Helper function to fetch all PRs with pagination
async function fetchAllMergedPRs(owner, repo) {
  let allMergedPRs = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const { data: prs } = await octokit.rest.pulls.list({
        owner,
        repo,
        state: "closed",
        per_page: 100,
        page,
        sort: "updated",
        direction: "desc",
      });

      // Filter for merged PRs only
      const mergedPRs = prs.filter((pr) => pr.merged_at);
      allMergedPRs = [...allMergedPRs, ...mergedPRs];

      // If we got less than 100 results, we've reached the end
      if (prs.length < 100) {
        hasMore = false;
      } else {
        page++;
      }

      // Safety limit to prevent infinite loops
      if (page > 20) {
        console.warn(`Reached page limit for ${owner}/${repo}`);
        hasMore = false;
      }
    } catch (error) {
      console.error(`Error fetching page ${page} for ${owner}/${repo}:`, error);
      hasMore = false;
    }
  }

  return allMergedPRs;
}

export async function GET() {
  try {
    const leaderboard = new Map();
    const committeeStats = new Map();
    const recentActivity = [];

    // Initialize committee stats
    const committees = [...new Set(Object.values(REPO_COMMITTEE_MAP))];
    committees.forEach((committee) => {
      committeeStats.set(committee, {
        name: committee,
        mergedPRs: 0,
        totalContributors: new Set(),
      });
    });

    // Fetch data for each repository
    for (const repoName of REPOS) {
      try {
        // Fetch all merged PRs with pagination
        const mergedPRs = await fetchAllMergedPRs(ORG_NAME, repoName);

        const committeeName = REPO_COMMITTEE_MAP[repoName];
        const stats = committeeStats.get(committeeName);

        if (stats) {
          // Count merged PRs
          stats.mergedPRs += mergedPRs.length;

          // Process each PR
          mergedPRs.forEach((pr) => {
            const username = pr.user.login;
            const avatar = pr.user.avatar_url;

            // Update leaderboard
            if (leaderboard.has(username)) {
              leaderboard.get(username).mergedPRs++;
            } else {
              leaderboard.set(username, {
                username,
                mergedPRs: 1,
                avatar,
              });
            }

            // Track contributors per committee
            stats.totalContributors.add(username);

            // Add to recent activity (we'll sort and limit later)
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
        // console.error(
        //   `Error processing ${ORG_NAME}/${repoName}:`,
        //   error.message
        // );
        // Continue with other repos even if one fails
      }
    }

    // Sort and limit recent activity to 10 most recent
    const sortedRecentActivity = recentActivity
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    // Convert leaderboard to array and sort
    const leaderboardArray = Array.from(leaderboard.values()).sort(
      (a, b) => b.mergedPRs - a.mergedPRs
    );

    // Convert committee stats to array and convert Set to number
    const committeeStatsArray = Array.from(committeeStats.values()).map(
      (stats) => ({
        name: stats.name,
        mergedPRs: stats.mergedPRs,
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
