import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

/**
 * `-foreground` aqui é o que vai *sobre* a cor sólida, nunca o texto sobre o
 * card. Texto usa o token da própria cor — todos passam AA sobre card e sobre
 * o fundo da página. Ver docs/dna-visual.md §4.
 */
const TONE_STYLES: Record<string, { value: string; chipBg: string; chipText: string; border: string }> = {
  default: { value: "text-foreground", chipBg: "bg-primary/12", chipText: "text-primary", border: "border-l-primary" },
  success: { value: "text-success", chipBg: "bg-success/12", chipText: "text-success", border: "border-l-success" },
  warning: { value: "text-warning", chipBg: "bg-warning/12", chipText: "text-warning", border: "border-l-warning" },
  critical: { value: "text-destructive", chipBg: "bg-destructive/12", chipText: "text-destructive", border: "border-l-destructive" },
  info: { value: "text-info", chipBg: "bg-info/12", chipText: "text-info", border: "border-l-info" },
};

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "critical" | "info";
  href?: string;
}) {
  const t = TONE_STYLES[tone];

  const card = (
    <Card
      className={cn(
        "gap-2 border-l-4 py-4 shadow-sm",
        t.border,
        href && "cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
      )}
    >
      <CardContent className="px-4">
        {/* min-w-0: por padrão um item flex tem min-width:auto e nunca encolhe
            menor que o texto — label ou hint longos (ex: "EPI — estoque
            crítico") empurravam a largura do card e estouravam a página. */}
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 text-xs font-medium text-muted-foreground">{label}</span>
          {Icon && (
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", t.chipBg)}>
              <Icon className={cn("size-3.5", t.chipText)} />
            </span>
          )}
        </div>
        <div className={cn("mt-1 font-mono text-2xl font-semibold tabular-nums", t.value)}>{value}</div>
        {hint && <p className="mt-1 text-xs break-words text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );

  if (!href) return card;

  return (
    <Link href={href} className="block">
      {card}
    </Link>
  );
}
