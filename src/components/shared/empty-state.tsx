"use client";

import { motion } from "framer-motion";
import { EmptyIllustration, type EmptyKind } from "./illustrations";
import { cn } from "@/lib/utils";

export function EmptyState({
  kind = "generic",
  title,
  description,
  action,
  className,
}: {
  kind?: EmptyKind;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex flex-col items-center justify-center text-center py-12 px-4", className)}
    >
      <EmptyIllustration kind={kind} className="w-32 h-32 mb-4" />
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm leading-6">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
