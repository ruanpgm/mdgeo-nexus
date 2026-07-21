import { CheckCircle2, Circle, MinusCircle, OctagonAlert, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StatusSemantico } from "@/lib/types";

const STATUS_STYLES: Record<StatusSemantico, string> = {
  ok: "bg-success/15 text-success border-success/30",
  atencao: "bg-warning/15 text-warning border-warning/40",
  critico: "bg-destructive/15 text-destructive border-destructive/30",
  info: "bg-info/15 text-info border-info/30",
  neutro: "bg-muted text-muted-foreground border-border",
};

/**
 * Forma de placa de trânsito: octógono para, triângulo adverte, círculo informa.
 * O técnico já chega treinado nisso — a forma lê antes da cor, e é o que faz o
 * status sobreviver a daltonismo e a sol forte. Ver docs/dna-visual.md §4.
 */
const STATUS_ICONS: Record<StatusSemantico, LucideIcon> = {
  ok: CheckCircle2,
  atencao: TriangleAlert,
  critico: OctagonAlert,
  info: Circle,
  neutro: MinusCircle,
};

export function StatusBadge({
  status,
  children,
  className,
}: {
  status: StatusSemantico;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = STATUS_ICONS[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      <Icon aria-hidden className="size-3 shrink-0" strokeWidth={2.5} />
      {children}
    </span>
  );
}
