"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  BellDot,
  Home,
  Wallet,
  ShoppingCart,
  Users,
  Wrench,
  ShieldCheck,
  IdCard,
  Truck,
  Briefcase,
  Building2,
  FolderKanban,
  FlaskConical,
  Cpu,
  Smartphone,
  LockKeyhole,
  GraduationCap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { dashboardKpis } from "@/lib/mock-data";

/** Destinos da paleta de comando — os mesmos setores da sidebar. */
const DESTINOS: { titulo: string; url: string; icon: LucideIcon }[] = [
  { titulo: "Home", url: "/", icon: Home },
  { titulo: "Financeiro", url: "/financeiro", icon: Wallet },
  { titulo: "GSE (Compras)", url: "/compras", icon: ShoppingCart },
  { titulo: "RH — Colaboradores", url: "/colaboradores", icon: Users },
  { titulo: "Equipamentos", url: "/equipamentos", icon: Wrench },
  { titulo: "SSMA — Saúde, Segurança e Meio Ambiente", url: "/ssma", icon: ShieldCheck },
  { titulo: "Mobilização", url: "/mobilizacao", icon: IdCard },
  { titulo: "Logística — Veículos", url: "/veiculos", icon: Truck },
  { titulo: "Comercial", url: "/comercial", icon: Briefcase },
  { titulo: "Clientes", url: "/clientes", icon: Building2 },
  { titulo: "Projetos", url: "/projetos", icon: FolderKanban },
  { titulo: "Hidroquímica", url: "/hidroquimica", icon: FlaskConical },
  { titulo: "TEA — Tecnologia e Automação", url: "/tea", icon: Cpu },
  { titulo: "App de Campo", url: "/campo", icon: Smartphone },
  { titulo: "Painel Admin", url: "/admin", icon: LockKeyhole },
];

export function AppTopbar() {
  const router = useRouter();
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [alertasAbertos, setAlertasAbertos] = useState(false);

  const alertas: { label: string; url: string; icon: LucideIcon }[] = [];
  if (dashboardKpis.treinamentosVencendo > 0) {
    alertas.push({
      label: `${dashboardKpis.treinamentosVencendo} treinamentos vencendo`,
      url: "/ssma",
      icon: GraduationCap,
    });
  }
  if (dashboardKpis.equipamentosCalibragemVencendo > 0) {
    alertas.push({
      label: `${dashboardKpis.equipamentosCalibragemVencendo} calibragens vencendo`,
      url: "/equipamentos?calibracao=vencendo",
      icon: Wrench,
    });
  }

  // ⌘K / Ctrl+K abre a busca em qualquer tela. Listener global com cleanup.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setBuscaAberta((aberta) => !aberta);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function irPara(url: string) {
    setBuscaAberta(false);
    router.push(url);
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />
      <button
        type="button"
        onClick={() => setBuscaAberta(true)}
        className="flex h-8 w-full max-w-sm items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="size-3.5" />
        <span>Buscar setor, tela...</span>
        <kbd className="ml-auto rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-3">
        <Popover open={alertasAbertos} onOpenChange={setAlertasAbertos}>
          <PopoverTrigger className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <BellDot className="size-4" />
            {alertas.length > 0 && (
              <span className="absolute top-1 right-1 flex size-2 rounded-full bg-warning" />
            )}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <PopoverHeader>
              <PopoverTitle>Alertas</PopoverTitle>
            </PopoverHeader>
            {alertas.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum alerta no momento.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {alertas.map((a) => (
                  <li key={a.url}>
                    <Link
                      href={a.url}
                      onClick={() => setAlertasAbertos(false)}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                      <a.icon className="size-4 shrink-0 text-warning" />
                      <span>{a.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>

        <Avatar className="size-8">
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">
            RG
          </AvatarFallback>
        </Avatar>
      </div>

      <CommandDialog
        open={buscaAberta}
        onOpenChange={setBuscaAberta}
        title="Busca"
        description="Vá para qualquer setor ou tela."
      >
        <Command>
          <CommandInput placeholder="Buscar setor, tela..." />
          <CommandList>
            <CommandEmpty>Nenhum resultado.</CommandEmpty>
            <CommandGroup heading="Ir para">
              {DESTINOS.map((d) => (
                <CommandItem
                  key={d.url}
                  value={d.titulo}
                  onSelect={() => irPara(d.url)}
                >
                  <d.icon className="text-muted-foreground" />
                  <span>{d.titulo}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </header>
  );
}
