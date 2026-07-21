"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Home,
  FolderKanban,
  Users,
  Truck,
  Wrench,
  ShoppingCart,
  ShieldCheck,
  Wallet,
  Smartphone,
  Droplets,
  LockKeyhole,
  Briefcase,
  Building2,
  IdCard,
  Gift,
  Cpu,
  FlaskConical,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { dashboardKpis } from "@/lib/mock-data";

type NavItem = {
  title: string;
  /** Ausente = setor real da empresa sem tela construída ainda ("em breve"). */
  url?: string;
  icon: LucideIcon;
  badge?: number;
};

/**
 * Fora de setor: é a porta de entrada para qualquer pessoa com acesso ao
 * sistema, não uma área da operação. Substitui o antigo Dashboard Principal
 * como rota raiz — o dashboard consolidado virou "Dashboard Diretoria".
 */
const home: NavItem = {
  title: "Home",
  url: "/",
  icon: Home,
};

/**
 * Organograma real da empresa — só 2 departamentos, Administrativo e
 * Técnico. Os setores nomeados aqui são os do organograma, na ordem passada.
 * RH e Logística usam a tela mais próxima que já existe (Colaboradores e
 * Veículos) até ganharem tela própria.
 */
const setores: { label: string; icon: LucideIcon; items: NavItem[] }[] = [
  {
    label: "Administrativo",
    icon: Building2,
    items: [
      { title: "Financeiro", url: "/financeiro", icon: Wallet },
      { title: "GSE (Compras)", url: "/compras", icon: ShoppingCart },
      {
        title: "RH",
        url: "/colaboradores",
        icon: Users,
        badge: dashboardKpis.colaboradoresPendencia,
      },
      {
        title: "Equipamentos",
        url: "/equipamentos",
        icon: Wrench,
        badge: dashboardKpis.equipamentosCalibragemVencendo,
      },
      { title: "SSMA (Saúde, Segurança e Meio Ambiente)", url: "/ssma", icon: ShieldCheck },
      { title: "Mobilização", url: "/mobilizacao", icon: IdCard },
      {
        title: "Logística",
        url: "/veiculos",
        icon: Truck,
        badge: dashboardKpis.veiculosManutencao,
      },
      { title: "Comercial", url: "/comercial", icon: Briefcase },
      { title: "Clientes", url: "/clientes", icon: Building2 },
    ],
  },
  {
    label: "Técnico",
    icon: FolderKanban,
    items: [
      { title: "Projetos", url: "/projetos", icon: FolderKanban },
      { title: "Hidroquímica", url: "/hidroquimica", icon: FlaskConical },
      { title: "TEA (Tecnologia e Automação)", url: "/tea", icon: Cpu },
    ],
  },
  /**
   * Bônus — entregável extra da proposta: o App de Campo demonstrado dentro
   * do próprio dashboard. Fica fora de Administrativo/Técnico de propósito.
   */
  {
    label: "Bônus",
    icon: Gift,
    items: [{ title: "App de Campo", url: "/campo", icon: Smartphone }],
  },
];

/** Admin não é setor do organograma — é visão de controle do sistema em si. */
const grupos: { label: string; icon: LucideIcon; items: NavItem[] }[] = [
  {
    label: "Admin",
    icon: LockKeyhole,
    items: [{ title: "Painel Admin", url: "/admin", icon: LockKeyhole }],
  },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  if (!item.url) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          disabled
          tooltip={`${item.title} — em breve`}
          className="cursor-default opacity-50"
        >
          <item.icon />
          <span>{item.title}</span>
        </SidebarMenuButton>
        <SidebarMenuBadge className="bg-sidebar-foreground/10 text-sidebar-foreground/50">
          Em breve
        </SidebarMenuBadge>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.url} />}
        isActive={active}
        tooltip={item.title}
      >
        <item.icon />
        <span>{item.title}</span>
      </SidebarMenuButton>
      {!!item.badge && (
        <SidebarMenuBadge className="bg-sidebar-warning/20 text-sidebar-warning">
          {item.badge}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
}

/** Grupo em dropdown: o cabeçalho é um botão que expande/recolhe os itens — menu organizado e limpo. */
function GrupoColapsavel({
  label,
  icon: Icon,
  items,
  pathname,
  aberto,
  onToggle,
}: {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  pathname: string;
  aberto: boolean;
  onToggle: () => void;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel
        render={
          <button type="button" onClick={onToggle} aria-expanded={aberto} />
        }
        className="flex w-full cursor-pointer items-center justify-between gap-2 text-left hover:text-sidebar-foreground"
      >
        <span className="flex items-center gap-1.5">
          <Icon className="size-3.5" />
          {label}
        </span>
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 transition-transform",
            aberto && "rotate-90",
          )}
        />
      </SidebarGroupLabel>
      {aberto && (
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <NavLink
                key={item.title}
                item={item}
                active={!!item.url && pathname === item.url}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  const grupoAtivo = [...setores, ...grupos].find((g) =>
    g.items.some((i) => i.url === pathname),
  );
  const [expandido, setExpandido] = useState<string | null>(
    grupoAtivo?.label ?? setores[0].label,
  );

  function alternar(label: string) {
    setExpandido((atual) => (atual === label ? null : label));
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-blue-logo to-brand-green-logo text-white shadow-sm">
                <Droplets className="size-4.5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="font-heading truncate font-semibold">MDGEO Nexus</span>
                <span className="truncate text-xs text-sidebar-foreground/55">
                  Hidrogeologia &amp; Meio Ambiente
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavLink item={home} active={pathname === home.url} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {setores.map((setor) => (
          <GrupoColapsavel
            key={setor.label}
            label={setor.label}
            icon={setor.icon}
            items={setor.items}
            pathname={pathname}
            aberto={expandido === setor.label}
            onToggle={() => alternar(setor.label)}
          />
        ))}

        {grupos.map((grupo) => (
          <GrupoColapsavel
            key={grupo.label}
            label={grupo.label}
            icon={grupo.icon}
            items={grupo.items}
            pathname={pathname}
            aberto={expandido === grupo.label}
            onToggle={() => alternar(grupo.label)}
          />
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
