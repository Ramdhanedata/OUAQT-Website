"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { macChip, machineOf } from "./machine";

/*
 * Which computer the owner is installing on, chosen once at step 4 and read
 * in two places: the download button on the left, and the guide beside it
 * that shows what that computer will say while installing. Guessed from the
 * browser first; the owner can always pick the other, since he may be
 * building on his phone or on a laptop and installing on the shop's desktop.
 *
 * Every Mac installs the same way, so the choice is Windows or Mac. Which
 * file a Mac gets follows its chip, when this computer is that Mac.
 */

export type InstallTarget = "windows" | "mac";
export type Chip = "apple" | "intel";

type Chosen = {
  target: InstallTarget;
  /* What this browser appears to be running on, to mark it in the choice. */
  detected: InstallTarget | null;
  /* This Mac's chip, when this computer is a Mac that says. */
  chip: Chip | null;
  choose: (target: InstallTarget) => void;
};

const Context = createContext<Chosen | null>(null);

export function InstallTargetProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<InstallTarget>("windows");
  const [detected, setDetected] = useState<InstallTarget | null>(null);
  const [chip, setChip] = useState<Chip | null>(null);
  const touched = useRef(false);

  useEffect(() => {
    const machine = machineOf();
    if (machine !== "windows" && machine !== "mac") return;
    setDetected(machine);
    /* A choice the owner already made is never overwritten by the guess. */
    if (!touched.current) setTarget(machine);
    if (machine === "mac") void macChip().then((found) => setChip(found === "apple" || found === "intel" ? found : null));
  }, []);

  return (
    <Context.Provider
      value={{
        target,
        detected,
        chip,
        choose: (next) => {
          touched.current = true;
          setTarget(next);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useInstallTarget(): Chosen {
  const chosen = useContext(Context);
  /* Outside step 4 (the account page, a resumed download) there is no provider: a fixed Windows choice. */
  return chosen ?? { target: "windows", detected: null, chip: null, choose: () => undefined };
}
