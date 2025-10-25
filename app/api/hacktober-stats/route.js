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

async function fetchAllMergedPRs(owner, repo) {
  let allMergedPRs = [];
  let page = 1;
  let hasMore = true;

  console.log(`Fetching all PRs from ${owner}/${repo}...`);

  while (hasMore) {
    try {
      const { data: prs } = await octokit.rest.pulls.list({
        owner,
        repo,
        state: "all",
        per_page: 100,
        page,
        sort: "created",
        direction: "desc",
      });

      const mergedPRs = prs.filter((pr) => pr.merged_at);
      allMergedPRs = [...allMergedPRs, ...mergedPRs];

      console.log(
        `Page ${page}: Found ${prs.length} PRs, ${mergedPRs.length} merged`
      );

      if (prs.length < 100) {
        hasMore = false;
      } else {
        page++;
      }

      if (page > 100) {
        console.warn(`Reached safety limit for ${owner}/${repo}`);
        hasMore = false;
      }
    } catch (error) {
      console.error(
        `Error fetching page ${page} for ${owner}/${repo}:`,
        error.message
      );
      hasMore = false;
    }
  }

  // console.log(
  //   `Total merged PRs found for ${owner}/${repo}: ${allMergedPRs.length}`
  // );
  return allMergedPRs;
}

// Alternative method: Fetch using GraphQL for better pagination
async function fetchAllMergedPRsGraphQL(owner, repo) {
  const query = `
    query($owner: String!, $repo: String!, $cursor: String) {
      repository(owner: $owner, name: $repo) {
        pullRequests(first: 100, after: $cursor, states: MERGED, orderBy: {field: CREATED_AT, direction: DESC}) {
          totalCount
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            number
            title
            author {
              login
              avatarUrl
            }
            mergedAt
          }
        }
      }
    }
  `;

  let allPRs = [];
  let hasNextPage = true;
  let cursor = null;
  let pageCount = 0;

  console.log(`Fetching merged PRs from ${owner}/${repo} using GraphQL...`);

  while (hasNextPage && pageCount < 100) {
    try {
      const response = await octokit.graphql(query, {
        owner,
        repo,
        cursor,
      });

      const pullRequests = response.repository.pullRequests;
      allPRs = [...allPRs, ...pullRequests.nodes];

      hasNextPage = pullRequests.pageInfo.hasNextPage;
      cursor = pullRequests.pageInfo.endCursor;
      pageCount++;

      // console.log(
      //   `GraphQL Page ${pageCount}: Found ${pullRequests.nodes.length} PRs (Total: ${allPRs.length}/${pullRequests.totalCount})`
      // );
    } catch (error) {
      console.error(`GraphQL error for ${owner}/${repo}:`, error.message);
      hasNextPage = false;
    }
  }

  // console.log(
  //   `Total merged PRs found via GraphQL for ${owner}/${repo}: ${allPRs.length}`
  // );
  return allPRs;
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
        totalContributors: new Set(), // Each committee tracks its own unique contributors
      });
    });

    // Fetch data for each repository using GraphQL
    for (const repoName of REPOS) {
      try {
        // Use GraphQL method for better pagination
        const mergedPRs = await fetchAllMergedPRsGraphQL(ORG_NAME, repoName);

        const committeeName = REPO_COMMITTEE_MAP[repoName];
        const stats = committeeStats.get(committeeName);

        if (stats) {
          // Count merged PRs
          stats.mergedPRs += mergedPRs.length;

          // Process each PR
          mergedPRs.forEach((pr) => {
            const username = pr.author?.login;
            const avatar = pr.author?.avatarUrl;

            if (!username) return; // Skip if no author

            if (leaderboard.has(username)) {
              leaderboard.get(username).mergedPRs++;
            } else {
              leaderboard.set(username, {
                username,
                mergedPRs: 1,
                avatar,
              });
            }

            // Track contributors per committee (can overlap between committees)
            // Each committee counts the contributor separately
            stats.totalContributors.add(username);

            // Add to recent activity
            recentActivity.push({
              user: username,
              repo: committeeName,
              time: getTimeAgo(new Date(pr.mergedAt)),
              action: "merged PR",
              avatar: avatar,
              title: pr.title,
              timestamp: new Date(pr.mergedAt),
            });
          });
        }

        // console.log(
        //   `${committeeName}: ${stats.mergedPRs} PRs, ${stats.totalContributors.size} unique contributors`
        // );
      } catch (error) {
        console.error(
          `Error processing ${ORG_NAME}/${repoName}:`,
          error.message
        );
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
        totalContributors: stats.totalContributors.size, // Count unique contributors per committee
      })
    );

    // Calculate total unique contributors across ALL committees (no duplicates)
    const allContributors = new Set();
    committeeStats.forEach((stats) => {
      stats.totalContributors.forEach((username) =>
        allContributors.add(username)
      );
    });

    // console.log("Final Stats:", {
    //   totalUniqueContributors: allContributors.size, // Unique across all committees
    //   totalContributorsAcrossCommittees: committeeStatsArray.reduce(
    //     (sum, c) => sum + c.totalContributors,
    //     0
    //   ), // Sum of all (with overlaps)
    //   totalPRs: leaderboardArray.reduce((sum, user) => sum + user.mergedPRs, 0),
    //   committees: committeeStatsArray,
    // });

    return NextResponse.json({
      leaderboard: leaderboardArray,
      committees: committeeStatsArray,
      recentActivity: sortedRecentActivity,
      lastUpdated: new Date().toISOString(),
      stats: {
        totalUniqueContributors: allContributors.size,
        totalPRs: leaderboardArray.reduce(
          (sum, user) => sum + user.mergedPRs,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats", details: error.message },
      { status: 500 }
    );
  }
}
