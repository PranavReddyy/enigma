import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { REPO_COMMITTEE_MAP, HACKTOBER_ORG } from "@/lib/hacktober-repositories";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const publicOctokit = new Octokit();
export const dynamic = "force-dynamic";
const RESPONSE_HEADERS = { "Cache-Control": "no-store" };
let cachedResult;
let pendingRefresh;

function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

const ORG_NAME = HACKTOBER_ORG;

const REPOS = Object.keys(REPO_COMMITTEE_MAP);

async function fetchAllMergedPRs(owner, repo, client = octokit) {
  let allMergedPRs = [];
  let page = 1;
  let hasMore = true;

  console.log(`Fetching all PRs from ${owner}/${repo}...`);

  while (hasMore) {
    try {
      const { data: prs } = await client.rest.pulls.list({
        owner,
        repo,
        state: "closed",
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
      throw error;
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
      throw error;
    }
  }

  // console.log(
  //   `Total merged PRs found via GraphQL for ${owner}/${repo}: ${allPRs.length}`
  // );
  return allPRs;
}

async function fetchMergedPRs(owner, repo) {
  if (process.env.GITHUB_TOKEN) {
    try {
      return await fetchAllMergedPRsGraphQL(owner, repo);
    } catch (error) {
      console.warn(`GraphQL unavailable for ${owner}/${repo}; trying REST`, error.message);
    }
  }
  let prs;
  try {
    prs = await fetchAllMergedPRs(owner, repo);
  } catch (error) {
    if (!process.env.GITHUB_TOKEN || ![401, 403, 404].includes(error.status)) throw error;
    prs = await fetchAllMergedPRs(owner, repo, publicOctokit);
  }
  return prs.map((pr) => ({
    number: pr.number,
    title: pr.title,
    author: pr.user ? { login: pr.user.login, avatarUrl: pr.user.avatar_url } : null,
    mergedAt: pr.merged_at,
  }));
}

export async function GET() {
  if (cachedResult && Date.now() - cachedResult.createdAt < 45000) return NextResponse.json(cachedResult.body, { status: cachedResult.status, headers: RESPONSE_HEADERS });
  if (!pendingRefresh) {
    pendingRefresh = buildStats().then(async (response) => {
      const body = await response.json();
      cachedResult = { body, status: response.status, createdAt: Date.now() };
      return cachedResult;
    }).finally(() => { pendingRefresh = undefined; });
  }
  const result = await pendingRefresh;
  return NextResponse.json(result.body, { status: result.status, headers: RESPONSE_HEADERS });
}

async function buildStats() {
  try {
    const leaderboard = new Map();
    const committeeStats = new Map();
    const recentActivity = [];
    const unavailableRepositories = [];

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
        const mergedPRs = await fetchMergedPRs(ORG_NAME, repoName);

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
        unavailableRepositories.push(repoName);
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
        available: !unavailableRepositories.some((repo) => REPO_COMMITTEE_MAP[repo] === stats.name),
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
      partial: unavailableRepositories.length > 0,
      unavailableRepositories,
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
    }, { headers: RESPONSE_HEADERS });
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats", details: error.message },
      { status: 500, headers: RESPONSE_HEADERS }
    );
  }
}
