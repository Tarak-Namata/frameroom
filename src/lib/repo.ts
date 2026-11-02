// Single source of truth for the project's GitHub links (override with NEXT_PUBLIC_REPO_URL for forks).
export const REPO_URL = (process.env.NEXT_PUBLIC_REPO_URL || "https://github.com/Tarak-Namata/frameroom").replace(/\/+$/, "");
export const ISSUES_URL = `${REPO_URL}/issues`;

// Pre-filled "new issue" link. Only non-sensitive details are included — never secrets or data.
export function newIssueUrl(details: Record<string, string>) {
  const env = Object.entries(details).map(([k, v]) => `- ${k}: ${v}`).join("\n");
  const body = `**What happened?**\n\n\n**What did you expect to happen?**\n\n\n**Steps to reproduce**\n1. \n2. \n\n**Environment** (filled in automatically)\n${env}\n`;
  return `${ISSUES_URL}/new?${new URLSearchParams({ title: "Problem: ", body }).toString()}`;
}
