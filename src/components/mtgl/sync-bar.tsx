import { CheckCircle2, RefreshCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type SyncBarStatus = "offline" | "sincronizando" | "sincronizado";

/**
 * Barra de sync persistente do app de campo — sistema visual de primeira
 * classe, não um badge de canto. Três estados: offline (slate sólido) ->
 * sincronizando (teal, animado) -> sincronizado (verde tint).
 *
 * É a única transição do sistema onde motion é obrigatório: é o único lugar
 * em que o movimento carrega significado — a mudança de estado em que o
 * técnico precisa confiar. Ver docs/dna-visual.md §5 e §7.
 */
export function SyncBar({ status, className }: { status: SyncBarStatus; className?: string }) {
  const config = {
    offline: {
      texto: "Offline — registros salvos no aparelho",
      classes: "bg-neutral text-neutral-foreground",
      Icon: WifiOff,
      spin: false,
    },
    sincronizando: {
      texto: "Sincronizando…",
      classes: "bg-info text-info-foreground",
      Icon: RefreshCw,
      spin: true,
    },
    sincronizado: {
      texto: "Sincronizado",
      classes: "bg-success/15 text-success",
      Icon: CheckCircle2,
      spin: false,
    },
  }[status];

  const { texto, classes, Icon, spin } = config;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium transition-colors duration-200",
        classes,
        className
      )}
    >
      <Icon className={cn("size-3.5 shrink-0", spin && "animate-spin")} aria-hidden />
      {texto}
    </div>
  );
}
