import type { BuilderCopy } from "@/builder/copy";

/*
 * What to press when the computer warns about the installer, on both
 * systems, the owner's own first. Plain steps, nothing about why: the
 * warning appears because the installers are not signed yet, and that is
 * ours to fix, not his to understand.
 */
export function InstallHelp({ copy, first }: { copy: BuilderCopy; first: "mac" | "windows" }) {
  const mac = (
    <div key="mac">
      <p className="text-base font-medium text-foreground">{copy.serial.onMac}</p>
      <p className="mt-1 text-base leading-relaxed text-muted-foreground">{copy.serial.macWarning}</p>
      <p className="mt-1 text-base leading-relaxed text-muted-foreground">{copy.serial.macWarningStill}</p>
    </div>
  );
  const windows = (
    <div key="windows">
      <p className="text-base font-medium text-foreground">{copy.serial.onWindows}</p>
      <p className="mt-1 text-base leading-relaxed text-muted-foreground">{copy.serial.windowsWarning}</p>
    </div>
  );
  /*
   * A computer that has OUAQT already needs no second install: the software
   * there asks about the shop just downloaded. Said because a Mac owner who
   * installs again and keeps both ends up with "OUAQT 2", "OUAQT 3".
   */
  const already = (
    <p key="already" className="text-base leading-relaxed text-muted-foreground">
      {copy.serial.alreadyInstalled}
    </p>
  );
  return <div className="space-y-4">{first === "mac" ? [mac, windows, already] : [windows, mac, already]}</div>;
}
