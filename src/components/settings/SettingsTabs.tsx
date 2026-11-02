"use client";
import { useState } from "react";
import type { publicSettings } from "@/lib/db";
import { PageHeader } from "../PageHeader";
import { BrandingForm } from "./BrandingForm";
import { EmailForm } from "./EmailForm";
import { GeneralForm } from "./GeneralForm";
import { ReportProblem } from "./ReportProblem";

export type PublicSettings = ReturnType<typeof publicSettings>;

const TABS = [
  { id: "branding", label: "Branding" },
  { id: "email", label: "Email", optional: true },
  { id: "general", label: "General" },
];

export function SettingsTabs({ settings, appUrlFromEnv, initialTab, report }: { settings: PublicSettings; appUrlFromEnv: string | null; initialTab?: string; report: Record<string, string> }) {
  const [tab, setTab] = useState(TABS.some((t) => t.id === initialTab) ? initialTab! : "branding");
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Studio" title="Settings" action={<ReportProblem details={report} />} />
      <div className="mb-12 flex gap-1 overflow-x-auto border-b border-neutral-200" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} data-testid={`settings-tab-${t.id}`}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${tab === t.id ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-900"}`}>
            {t.label}{t.optional && <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-neutral-400">optional</span>}
          </button>
        ))}
      </div>
      {tab === "branding" && <BrandingForm initial={settings} />}
      {tab === "email" && <EmailForm initial={settings.email} />}
      {tab === "general" && <GeneralForm appUrl={settings.appUrl} appUrlFromEnv={appUrlFromEnv} />}
    </div>
  );
}
