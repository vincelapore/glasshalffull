import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AccordionRevealProps = {
  open: boolean;
  children: ReactNode;
  className?: string;
  id?: string;
};

export function AccordionReveal({
  open,
  children,
  className,
  id,
}: AccordionRevealProps) {
  return (
    <div
      id={id}
      data-open={open}
      inert={!open}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-200 [transition-timing-function:var(--ease-out)] motion-reduce:transition-none",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
