"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { macChip, machineOf } from "./machine";

/*
 * Which computer the owner is installing on, chosen once at step 4 and read
 * in two places: the download button on the left, and the guide beside it
 * that shows what that computer will say while installing. Guessed from the
 * browser first; the owner can always pick another, since he may be building
 * on his phone or on a laptop and installing on the shop's desktop.
 */

export type InstallTarget = "windows" | "mac-intel" | "mac-apple";

type Chosen = {
  target: InstallTarget;
  /* What this browser appears to be running on, to mark it in the choice. */
  detected: InstallTarget | null;
  choose: (target: InstallTarget) => void;
};

const Context = createContext<Chosen | null>(null);

export function InstallTargetProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<InstallTarget>("windows");
  const [detected, setDetected] = useState<InstallTarget | null>(null);
  const touched = useRef(false);

  useEffect(() => {
    const machine = machineOf();
    if (machine === "windows") {
      setDetected("windows");
      setTarget("windows");
    } else if (machine === "mac") {
      /* An Intel build runs on both kinds of Mac, so a Mac that will not say which is offered that one. */
      setDetected("mac-intel");
      setTarget("mac-intel");
      void macChip().then((chip) => {
        if (chip !== "apple") return;
        setDetected("mac-apple");
        /* A choice the owner already made is never overwritten by a late guess. */
        if (!touched.current) setTarget("mac-apple");
      });
    }
  }, []);

  return (
    <Context.Provider
      value={{
        target,
        detected,
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
  return chosen ?? { target: "windows", detected: null, choose: () => undefined };
}
