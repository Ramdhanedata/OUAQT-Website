"use client";

import type { ReactNode } from "react";
import { ArrowRight, Download, FileDown, Folder, Lock, ShieldAlert } from "lucide-react";
import type { Pack } from "@/app-ui/packs";
import type { BuilderCopy } from "@/builder/copy";
import { packIcons } from "@/components/packs/pack-icons";
import { cn } from "@/lib/utils";
import type { Chip, InstallTarget } from "./install-target";

/*
 * How to install, for the computer the owner chose, one small step at a
 * time, each with a drawing of what the screen will show.
 *
 * The warnings are the part people stop at. Windows and the Mac both warn
 * about software they do not know yet, and an owner who has never seen that
 * screen reads it as "this is dangerous" and closes it. So each warning is
 * drawn, with the one thing to press marked in gold, and the words are the
 * system's own words, so what he reads here is what he sees there.
 *
 * The drawings are plain boxes, not pictures of the real windows: they only
 * have to show where to look. The app wears its trade's icon, as the
 * installed software does once it opens.
 *
 * There is no serial to type at the end: the software opens its shop by
 * itself on the computer it was downloaded to.
 */

type Step = { title: string; body: string; art: ReactNode };

export function InstallGuide({
  copy,
  target,
  chip,
  pack,
  shop,
  compact = false,
}: {
  copy: BuilderCopy;
  target: InstallTarget;
  chip: Chip | null;
  pack: Pack;
  shop: string;
  /* Under the download on a narrow screen: the drawings go under their sentence. */
  compact?: boolean;
}) {
  const t = copy.install;
  const mac = target === "mac";
  const file = !mac ? "OUAQT-windows-setup.exe" : chip === "intel" ? "OUAQT-mac-x64.dmg" : "OUAQT-mac-arm64.dmg";
  const icon = <AppIcon pack={pack} />;

  const steps: Step[] = mac
    ? [
        { title: t.macStep1Title, body: t.macStep1, art: <DownloadsArt label={t.artDownloads} file={file} /> },
        { title: t.macStep2Title, body: t.macStep2, art: <DragArt applications={t.artApplications} icon={icon} /> },
        { title: t.macStep3Title, body: t.macStep3, art: <MacAlertArt title={t.artMacTitle} body={t.artMacBody} trash={t.artTrash} done={t.artDone} icon={<AppIcon pack={pack} size={30} />} /> },
        {
          title: t.macStep4Title,
          body: t.macStep4,
          art: <PrivacyArt privacy={t.artPrivacy} general={t.artGeneral} blocked={t.artBlocked} openAnyway={t.artOpenAnyway} />,
        },
        { title: t.macStep5Title, body: t.macStep5, art: <ConfirmArt password={t.artPassword} open={t.artOpen} /> },
        { title: t.lastTitle, body: t.last, art: <ReadyArt shop={shop} ready={t.artReady} trial={t.artTrial} pack={pack} /> },
      ]
    : [
        { title: t.winStep1Title, body: t.winStep1, art: <DownloadsArt label={t.artDownloads} file={file} /> },
        { title: t.winStep2Title, body: t.winStep2, art: <SmartScreenArt title={t.artWinTitle} body={t.artWinBody} more={t.artMoreInfo} dontRun={t.artDontRun} /> },
        {
          title: t.winStep3Title,
          body: t.winStep3,
          art: <SmartScreenArt title={t.artWinTitle} app={t.artApp} file={file} run={t.artRunAnyway} dontRun={t.artDontRun} />,
        },
        { title: t.winStep4Title, body: t.winStep4, art: <DesktopArt icon={icon} /> },
        { title: t.lastTitle, body: t.last, art: <ReadyArt shop={shop} ready={t.artReady} trial={t.artTrial} pack={pack} /> },
      ];

  return (
    <section className={cn("rounded-2xl border border-border bg-surface", compact ? "p-5" : "p-6 sm:p-8")}>
      <h2 className="text-xl font-semibold text-foreground">{mac ? t.guideMac : t.guideWindows}</h2>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">{t.guideIntro}</p>

      <ol className="mt-6 space-y-6">
        {steps.map((step, index) => (
          <li key={step.title} className={cn("grid gap-4", compact ? "grid-cols-1" : "sm:grid-cols-[minmax(0,1fr)_280px] sm:items-center")}>
            <div className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-base font-semibold text-background">
                {index + 1}
              </span>
              <div>
                <p className="text-base font-semibold leading-snug text-foreground">{step.title}</p>
                <p className="mt-1 text-base leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </div>
            <div className={compact ? "ps-[3.25rem]" : undefined} aria-hidden>
              {step.art}
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">{t.once}</p>
    </section>
  );
}

/* ── The drawings ────────────────────────────────────────────────────── */

/* The one thing to press, ringed in the brand's gold. */
const MARK = "ring-2 ring-accent ring-offset-2 ring-offset-white";

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div dir="ltr" className={cn("overflow-hidden rounded-xl border border-black/10 bg-white text-[12px] leading-snug text-black shadow-sm", className)}>
      {children}
    </div>
  );
}

/* The trade's icon, as the installed software wears it: the gold symbol on the black tile. */
function AppIcon({ pack, size = 36 }: { pack: Pack; size?: number }) {
  const Symbol = packIcons[pack];
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-[22%] bg-gradient-to-br from-[#24211c] to-[#0a0a0a] text-accent"
      style={{ width: size, height: size }}
    >
      <Symbol style={{ width: size * 0.56, height: size * 0.56 }} strokeWidth={1.75} />
    </span>
  );
}

function DownloadsArt({ label, file }: { label: string; file: string }) {
  return (
    <Frame className="p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-black/50">
        <Download className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className={cn("flex items-center gap-2 rounded-lg bg-black/[0.04] px-2.5 py-2", MARK)}>
        <FileDown className="h-5 w-5 shrink-0 text-black/60" />
        <span className="truncate font-medium">{file}</span>
      </div>
    </Frame>
  );
}

function SmartScreenArt({
  title,
  body,
  more,
  app,
  file,
  run,
  dontRun,
}: {
  title: string;
  body?: string;
  more?: string;
  app?: string;
  file?: string;
  run?: string;
  dontRun: string;
}) {
  return (
    <Frame className="border-0 bg-[#0b5cad] p-3.5 text-white">
      <div className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-[14px] font-semibold leading-tight">{title}</p>
      </div>
      {body ? <p className="mt-2 text-[11px] opacity-90">{body}</p> : null}
      {more ? <p className={cn("mt-2 inline-block rounded px-0.5 text-[11px] underline", MARK, "ring-offset-[#0b5cad]")}>{more}</p> : null}
      {app && file ? (
        <p className="mt-2 text-[11px] opacity-90">
          {app} : <span className="font-semibold">{file}</span>
        </p>
      ) : null}
      <div className="mt-3 flex justify-end gap-2">
        {run ? <span className={cn("rounded-sm border border-white/80 px-2 py-1 text-[11px]", MARK, "ring-offset-[#0b5cad]")}>{run}</span> : null}
        <span className="rounded-sm border border-white/60 px-2 py-1 text-[11px] opacity-80">{dontRun}</span>
      </div>
    </Frame>
  );
}

function DesktopArt({ icon }: { icon: ReactNode }) {
  return (
    <Frame className="flex h-[96px] items-center justify-center bg-gradient-to-br from-[#1c4f8f] to-[#3b7dc4]">
      <div className={cn("flex flex-col items-center gap-1 rounded-lg p-1.5 text-white", MARK, "ring-offset-[#2a64a8]")}>
        {icon}
        <span className="text-[11px]">OUAQT</span>
      </div>
    </Frame>
  );
}

function MacBar() {
  return (
    <div className="flex gap-1.5 px-3 pt-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
    </div>
  );
}

function DragArt({ applications, icon }: { applications: string; icon: ReactNode }) {
  return (
    <Frame>
      <MacBar />
      <div className="flex items-center justify-center gap-5 px-4 pb-4 pt-2">
        <div className="flex flex-col items-center gap-1">
          {icon}
          <span className="text-[11px]">OUAQT</span>
        </div>
        <ArrowRight className="h-5 w-5 text-accent" />
        <div className={cn("flex flex-col items-center gap-1 rounded-lg p-1", MARK)}>
          <Folder className="h-9 w-9 fill-[#6cb2f5] text-[#4a97e0]" />
          <span className="text-[11px]">{applications}</span>
        </div>
      </div>
    </Frame>
  );
}

function MacAlertArt({ title, body, trash, done, icon }: { title: string; body: string; trash: string; done: string; icon: ReactNode }) {
  return (
    <Frame className="bg-[#f2f2f2] p-3.5 text-center">
      <div className="mx-auto mb-2 w-fit">
        {icon}
      </div>
      <p className="text-[12.5px] font-semibold">{title}</p>
      <p className="mt-1 text-[10.5px] text-black/60">{body}</p>
      <div className="mt-2.5 space-y-1.5">
        <span className="block rounded-md bg-white px-2 py-1 text-[11px] shadow-sm">{trash}</span>
        <span className={cn("block rounded-md bg-[#0a84ff] px-2 py-1 text-[11px] font-medium text-white", MARK, "ring-offset-[#f2f2f2]")}>{done}</span>
      </div>
    </Frame>
  );
}

function PrivacyArt({ privacy, general, blocked, openAnyway }: { privacy: string; general: string; blocked: string; openAnyway: string }) {
  return (
    <Frame>
      <MacBar />
      <div className="grid grid-cols-[92px_1fr] gap-2 p-2.5 pt-2">
        <div className="space-y-1 text-[10.5px]">
          <span className="block truncate rounded px-1.5 py-1 text-black/60">{general}</span>
          <span className="flex items-center gap-1 truncate rounded bg-[#0a84ff] px-1.5 py-1 font-medium text-white">
            <Lock className="h-3 w-3 shrink-0" />
            <span className="truncate">{privacy}</span>
          </span>
        </div>
        <div className="rounded-lg bg-black/[0.04] p-2">
          <p className="text-[10.5px] text-black/70">{blocked}</p>
          <span className={cn("mt-2 inline-block rounded-md bg-white px-2 py-1 text-[11px] font-medium shadow-sm", MARK)}>{openAnyway}</span>
        </div>
      </div>
    </Frame>
  );
}

function ConfirmArt({ password, open }: { password: string; open: string }) {
  return (
    <Frame className="bg-[#f2f2f2] p-3.5">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-black/50" />
        <span className="text-[11px] text-black/60">{password}</span>
      </div>
      <div className="mt-2 rounded-md border border-black/15 bg-white px-2 py-1.5 tracking-[0.3em]">••••••••</div>
      <div className="mt-2.5 flex justify-end">
        <span className={cn("rounded-md bg-[#0a84ff] px-3 py-1 text-[11px] font-medium text-white", MARK, "ring-offset-[#f2f2f2]")}>{open}</span>
      </div>
    </Frame>
  );
}

/* The software, open on his shop, with nothing asked. */
function ReadyArt({ shop, ready, trial, pack }: { shop: string; ready: string; trial: string; pack: Pack }) {
  return (
    <Frame className="bg-[#f0eee6]">
      <div className="flex h-6 items-center gap-1.5 border-b border-black/10 bg-[#e6e3d9] px-2.5">
        <span className="h-2 w-2 rounded-full bg-black/20" />
        <span className="h-2 w-2 rounded-full bg-black/20" />
        <span className="h-2 w-2 rounded-full bg-black/20" />
      </div>
      <div className="flex items-center gap-3 p-3">
        <AppIcon pack={pack} size={34} />
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-semibold">{shop}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-black/60">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2e6b34]" />
            {ready}
          </p>
        </div>
      </div>
      <p className={cn("mx-3 mb-3 rounded-md bg-white px-2 py-1.5 text-center text-[11px] font-medium", MARK, "ring-offset-[#f0eee6]")}>{trial}</p>
    </Frame>
  );
}
