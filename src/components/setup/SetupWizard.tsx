"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "../AuthLayout";
import { CodeStep } from "./CodeStep";
import { AccountStep } from "./AccountStep";
import { LogoStep } from "./LogoStep";
import { ColorStep } from "./ColorStep";

type Step = "code" | "account" | "logo" | "color";

const COPY: Record<Step, { title: string; subtitle: string }> = {
  code: { title: "Enter your setup code.", subtitle: "This Frameroom is protected by a setup code (the SETUP_CODE value set when it was installed — check your hosting panel's environment settings). It stops strangers from claiming your studio." },
  account: { title: "Create your studio.", subtitle: "You'll be the only owner. It takes about a minute, with no files to edit. You can change everything later in Settings." },
  logo: { title: "Add your logo.", subtitle: "It appears at the top of every client gallery. You can skip this and add it later." },
  color: { title: "Pick your color.", subtitle: "Used for buttons and highlights in your client galleries." },
};

export function SetupWizard({ codeRequired, initialAccent, extra }: { codeRequired: boolean; initialAccent: string; extra?: React.ReactNode }) {
  const router = useRouter();
  const steps: Step[] = codeRequired ? ["code", "account", "logo", "color"] : ["account", "logo", "color"];
  const [step, setStep] = useState<Step>(steps[0]);
  const [code, setCode] = useState("");
  const index = steps.indexOf(step);
  const next = () => setStep(steps[index + 1]);
  const finish = () => { router.replace("/admin"); router.refresh(); };

  return (
    <AuthLayout eyebrow={`Setup · ${String(index + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`} title={COPY[step].title} subtitle={COPY[step].subtitle} extra={extra}>
      <div className="mb-8 flex gap-1.5" data-testid="setup-progress">
        {steps.map((s, i) => <span key={s} className={`h-[2px] flex-1 transition-colors duration-500 ${i <= index ? "bg-neutral-900" : "bg-neutral-200"}`} />)}
      </div>
      <div key={step} className="animate-rise">
        {step === "code" && <CodeStep onDone={(c) => { setCode(c); next(); }} />}
        {step === "account" && <AccountStep setupCode={code} onDone={next} />}
        {step === "logo" && <LogoStep onDone={next} />}
        {step === "color" && <ColorStep initialAccent={initialAccent} onDone={finish} />}
      </div>
    </AuthLayout>
  );
}
