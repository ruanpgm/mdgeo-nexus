"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  IdCard,
  ListChecks,
  ShieldCheck,
  UserX,
} from "lucide-react";

import { PageHeader } from "@/components/mtgl/page-header";
import { KpiCard } from "@/components/mtgl/kpi-card";
import { StatusBadge } from "@/components/mtgl/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { clientes } from "@/lib/mock-data";
import {
  getColaboradoresComImpedimento,
  getMobilizacoes,
  getMobilizacoesPorCliente,
} from "@/lib/derivacoes";
import { cn } from "@/lib/utils";

export default function MobilizacaoPage() {
  const todas = getMobilizacoes();
  const vencendoOuVencidas = todas.filter(
    (m) => m.prazoCracha.bucket === "T0" || m.prazoCracha.bucket === "T1",
  );
  const aptos = new Set(
    todas.filter((m) => m.statusGeral === "ok").map((m) => m.colaboradorId),
  ).size;
  // Total de pessoas mobilizadas (as mobilizações têm uma linha por crachá,
  // então contamos colaboradores únicos para a fração "aptos de mobilizados").
  const totalMobilizados = new Set(todas.map((m) => m.colaboradorId)).size;
  const impedidos = getColaboradoresComImpedimento();
  const [clienteFiltro, setClienteFiltro] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mobilização"
        description="Crachá, cursos e documentos exigidos por cada mineradora para autorizar o acesso da equipe. Dados fictícios para demonstração."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Crachás ativos" value={todas.length} icon={IdCard} />
        <KpiCard
          label="Crachás vencidos ou vencendo"
          value={vencendoOuVencidas.length}
          icon={AlertTriangle}
          tone={vencendoOuVencidas.length > 0 ? "critical" : "success"}
        />
        <KpiCard
          label="Colaboradores aptos"
          value={`${aptos} de ${totalMobilizados}`}
          hint="aptos entre os colaboradores mobilizados"
          icon={ShieldCheck}
          tone="success"
        />
        <KpiCard
          label="Com impedimentos"
          value={impedidos.length}
          hint="impedem a mobilização para campo"
          icon={UserX}
          tone={impedidos.length > 0 ? "critical" : "success"}
        />
      </div>

      <Card
        className={cn(
          impedidos.length > 0 && "border-l-4 border-l-destructive",
        )}
      >
        <CardHeader>
          <CardTitle>Colaboradores com impedimentos</CardTitle>
          <CardDescription>
            Pendências que travam a mobilização para campo, com os clientes
            afetados.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          {impedidos.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nenhum colaborador com impedimento de mobilização.
            </p>
          ) : (
            impedidos.map((c) => (
              <Link
                key={c.colaboradorId}
                href={`/colaboradores?open=${c.colaboradorId}`}
                className="flex flex-col gap-1.5 rounded-md border p-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{c.nome}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {c.cargo}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.pendencias.map((p, i) => (
                    <span
                      key={i}
                      className="rounded-md border border-destructive/40 px-2 py-0.5 text-xs text-destructive"
                    >
                      {p}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Clientes afetados: {c.clientes.join(" · ")}
                </p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {vencendoOuVencidas.length > 0 && (
        <Card className="border-l-4 border-l-destructive">
          <CardHeader>
            <CardTitle>Crachás vencidos ou vencendo</CardTitle>
            <CardDescription>
              Sem crachá válido não há acesso à mina, mesmo com todo o resto em
              dia.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {vencendoOuVencidas.map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.clienteNome} · {m.unidade} · {m.numeroCracha}
                  </p>
                </div>
                <StatusBadge status={m.prazoCracha.status} className="shrink-0">
                  {m.prazoCracha.label}
                </StatusBadge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setClienteFiltro(null)}
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
            !clienteFiltro
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted",
          )}
        >
          Todas as mineradoras
        </button>
        {clientes.map((c) => (
          <button
            key={c.id}
            onClick={() => setClienteFiltro(c.id)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              clienteFiltro === c.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {c.nome}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {clientes
          .filter((c) => !clienteFiltro || c.id === clienteFiltro)
          .map((cliente) => {
            const mobilizacoes = getMobilizacoesPorCliente(cliente.id);
            return (
              <Card key={cliente.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="size-4 text-primary" />
                    {cliente.nome}
                  </CardTitle>
                  <CardDescription>
                    {cliente.unidades.join(" · ")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-md border p-3">
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <ListChecks className="size-3.5" /> Exigências de acesso
                      </p>
                      <ul className="flex flex-col gap-1 text-xs">
                        {cliente.exigenciasAcesso.map((e, i) => (
                          <li key={i}>• {e}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                        Documentos necessários
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {cliente.documentosNecessarios.map((d, i) => (
                          <span
                            key={i}
                            className="rounded-md border bg-muted/40 px-2 py-0.5 text-xs"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Contato: {cliente.contato.nome} ({cliente.contato.cargo}
                        ) · {cliente.contato.telefone}
                      </p>
                    </div>
                  </div>

                  {mobilizacoes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Nenhum colaborador com crachá para este cliente.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Colaborador</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Unidade</TableHead>
                            <TableHead>Crachá</TableHead>
                            <TableHead>Validade</TableHead>
                            <TableHead>Aptidão geral</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mobilizacoes.map((m, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">
                                {m.nome}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {m.cargo}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {m.unidade}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {m.numeroCracha}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={m.prazoCracha.status}>
                                  {m.prazoCracha.label}
                                </StatusBadge>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={m.statusGeral}>
                                  {m.statusGeral === "ok"
                                    ? "Apto"
                                    : m.pendenciasGerais.length > 0
                                      ? m.pendenciasGerais.join(", ")
                                      : "Pendência"}
                                </StatusBadge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
