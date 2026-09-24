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
  return <div className="space-y-4">{first === "mac" ? [mac, windows] : [windows, mac]}</div>;
}
