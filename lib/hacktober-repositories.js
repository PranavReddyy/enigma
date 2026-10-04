export const HACKTOBER_ORG = "MU-Enigma";

export const HACKTOBER_COMMITTEES = [
  { name: "AI/ML", repoName: "Hacktoberfest26-AIML-Challenges" },
  { name: "SysCom", repoName: "Hacktoberfest2026-Systems-and-Security-Challenges" },
  { name: "GameDev", repoName: "Hacktoberfest26-GameDev-Challenges" },
  { name: "WebDev", repoName: "Hacktoberfest26-WebDev-Challenges" },
  { name: "Theoretical & Math", repoName: "Hacktoberfest26-Theoretical-Mathematics-Challenges" },
];

export const REPO_COMMITTEE_MAP = Object.fromEntries(
  HACKTOBER_COMMITTEES.map(({ name, repoName }) => [repoName, name])
);
