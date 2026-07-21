import { Battery, Signal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Moldura de celular reutilizável. Dentro dela, tudo roda em
 * `data-density="field"` — o modo de campo do design system: alvo mínimo
 * 56px, piso de fonte 16px, sem dark mode. Ver docs/dna-visual.md §5.
 *
 * O frame comunica "isto é o app" para quem está vendo o mockup; a
 * superfície real dentro dele é a que os componentes de campo consomem.
 *
 * A sombra em camadas + o glow colorido abaixo são uma exceção deliberada e
 * escopada à regra "flat, shadow-mínimo" do DNA (§8) — aquela regra vale
 * para a UI operacional (cards, tabelas, painéis do dashboard). Aqui é o
 * bezel de um hardware fotografado para uma vitrine de produto: profundidade
 * real é o ponto. Nada disso entra na tela operacional dentro do bezel.
 */
export function DeviceFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-[840px] w-[400px] rounded-[3rem] border-[10px] border-foreground/90 bg-foreground/90",
        "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3),0_30px_60px_-15px_rgba(0,0,0,0.4),0_0_140px_-20px_color-mix(in_srgb,var(--primary)_45%,transparent)]",
        className,
      )}
    >
      <div
        data-density="field"
        // bg-background: sem isso a "tela" do celular é transparente e deixa
        // vazar o que estiver pintado atrás no DOM — inofensivo enquanto o
        // fundo da página era uniforme, mas os glows coloridos do Stage
        // vazavam através dela, esmaecendo os cards de baixo para cima
        // (mais forte perto do centro do blob azul). Bug real, não artefato
        // de captura — visto numa screenshot do usuário, não só em teste.
        className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.375rem] bg-background"
      >
        <div className="absolute top-0 left-1/2 z-20 h-6 w-36 -translate-x-1/2 rounded-b-2xl bg-foreground/90" />

        <div className="flex items-center justify-between px-5 pt-2 pb-1 text-[10px] font-medium text-muted-foreground">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <Signal className="size-3" />
            <Battery className="size-3" />
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
