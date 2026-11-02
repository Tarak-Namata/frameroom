"use client";
import { Bug } from "lucide-react";
import { newIssueUrl } from "@/lib/repo";

// Opens a pre-filled GitHub issue in a new tab. Adds browser info client-side; no personal data.
export function ReportProblem({ details }: { details: Record<string, string> }) {
  function open() {
    const url = newIssueUrl({ ...details, Browser: navigator.userAgent, Page: window.location.pathname });
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return (
    <button onClick={open} className="btn-secondary px-4 py-2" data-testid="report-problem-button">
      <Bug className="h-3.5 w-3.5" /> Report a problem
    </button>
  );
}
