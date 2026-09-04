import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type ContainerProps = HTMLAttributes<HTMLDivElement>;

// TODO(customize): the max-w-container value lives in tailwind.config.ts
export function Container({ className, children, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-container container-px", className)}
      {...props}
    >
      {children}
    </div>
  );
}
