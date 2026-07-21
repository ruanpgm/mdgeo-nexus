import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/status-map";

/**
 * Placeholder de foto do mockup — o demo não armazena binário, mas as telas
 * precisam mostrar ONDE a foto vive e O QUE ela documenta (retirada de
 * equipamento, registro de acidente, conclusão de tarefa). Renderiza um
 * quadro flat/border-first (DNA §8) com etiqueta, legenda e metadados, no
 * lugar exato onde a foto real entraria.
 *
 * Justificativa do componente custom (DNA §10): usado em 4 abas —
 * Equipamentos, SSMA, Logística e App de Campo. Sem ele, cada aba inventaria
 * seu próprio placeholder.
 */
export function MockFoto({
  legenda,
  etiqueta,
  data,
  responsavel,
  className,
}: {
  legenda: string;
  /** Rótulo curto no canto: "Retirada", "Devolução", "Registro"… */
  etiqueta?: string;
  data?: string;
  responsavel?: string;
  className?: string;
}) {
  return (
    <figure className={cn("min-w-0", className)}>
      <div
        className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md border bg-muted/50"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 10px, var(--border) 10px, var(--border) 11px)",
        }}
      >
        <span className="flex size-9 items-center justify-center rounded-md border bg-background text-muted-foreground">
          <Camera aria-hidden className="size-4.5" />
        </span>
        {etiqueta && (
          <span className="absolute top-1.5 left-1.5 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
            {etiqueta}
          </span>
        )}
      </div>
      <figcaption className="mt-1 text-xs text-muted-foreground">
        <span className="block truncate">{legenda}</span>
        {(data || responsavel) && (
          <span className="block truncate font-mono text-[10px] tabular-nums">
            {[data && formatDate(data), responsavel].filter(Boolean).join(" · ")}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
