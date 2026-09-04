import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type SectionProps = HTMLAttributes<HTMLElement> & {
  as?: "section" | "div";
};

export function Section({
  className,
  children,
  as: Tag = "section",
  ...props
}: SectionProps) {
  return (
    <Tag className={cn("py-20 sm:py-28", className)} {...props}>
      {children}
    </Tag>
  );
}
