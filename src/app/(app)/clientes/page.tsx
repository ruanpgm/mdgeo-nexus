"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  FileText,
  ListChecks,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { PageHeader } from "@/components/mtgl/page-header";
import { KpiCard } from "@/components/mtgl/kpi-card";
import { StatusBadge } from "@/components/mtgl/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatBRL, projetoStatusMap } from "@/lib/status-map";
import { clientes } from "@/lib/mock-data";
import { useDataStore } from "@/lib/store";

export default function ClientesPage() {
  return (
    <Suspense fallback={null}>
      <ClientesContent />
    </Suspense>
  );
}

function ClientesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("open");
  // Projetos vêm do store (não do mock estático) para refletir criações e
  // exclusões feitas na aba Comercial — mesma fonte das outras telas.
  const { projetos } = useDataStore();

  // `?open=` da URL abre o detalhe (a Home linka para cá assim), e `selecionado`
  // é derivado — sem efeito sincronizando state com URL.
  //
  // `abertoLocal` tem três valores, e os três importam:
  //   undefined -> ninguém mexeu; manda o ?open= da URL
  //   string    -> abriu este aqui pelo clique
  //   null      -> fechou de propósito; ignora o ?open=
  // Sem o sentinela, `null` significaria "nunca cliquei" e "fechei" ao mesmo
  // tempo, e o ?open= reabriria o detalhe que o usuário acabou de fechar.
  const [abertoLocal, setAbertoLocal] = useState<string | null | undefined>(
    undefined,
  );
  const selecionadoId = abertoLocal === undefined ? openId : abertoLocal;
  const selecionado = selecionadoId
    ? (clientes.find((c) => c.id === selecionadoId) ?? null)
    : null;

  function fechar() {
    setAbertoLocal(null);
    if (openId) {
      const q = new URLSearchParams(searchParams.toString());
      q.delete("open");
      router.replace(q.size ? `/clientes?${q}` : "/clientes", {
        scroll: false,
      });
    }
  }

  const totalUnidades = clientes.reduce((a, c) => a + c.unidades.length, 0);
  const totalContratado = projetos.reduce((a, p) => a + p.valorContrato, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description="Mineradoras atendidas — exigências de acesso, localizações, contato e documentação. Dados fictícios para demonstração."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Clientes ativos"
          value={clientes.length}
          icon={Building2}
        />
        <KpiCard
          label="Unidades atendidas"
          value={totalUnidades}
          icon={MapPin}
        />
        <KpiCard
          label="Faturamento contratado"
          value={formatBRL(totalContratado)}
          icon={FileText}
          tone="success"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {clientes.map((c) => {
          const projetosDoCliente = projetos.filter(
            (p) => p.clienteId === c.id,
          );
          return (
            <Card
              key={c.id}
              onClick={() => setAbertoLocal(c.id)}
              className="cursor-pointer gap-3 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardContent className="flex flex-col gap-2 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.segmento}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                    {projetosDoCliente.length}{" "}
                    {projetosDoCliente.length === 1 ? "projeto" : "projetos"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.unidades.join(" · ")}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selecionado} onOpenChange={(v) => !v && fechar()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          {selecionado && (
            <>
              <DialogHeader>
                <DialogTitle>{selecionado.nome}</DialogTitle>
                <DialogDescription>
                  {selecionado.segmento} · {selecionado.cnpj}
                </DialogDescription>
              </DialogHeader>
              <div className="flex min-w-0 flex-col gap-4 pb-2">
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                    <MapPin className="size-4 text-primary" /> Unidades
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selecionado.unidades.map((u, i) => (
                      <span
                        key={i}
                        className="rounded-md border bg-muted/40 px-2 py-1 text-xs"
                      >
                        {u}
                      </span>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="mb-1.5 text-sm font-medium">Contato</p>
                  <p className="text-sm">
                    {selecionado.contato.nome} · {selecionado.contato.cargo}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="size-3.5" />{" "}
                    {selecionado.contato.telefone}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="size-3.5" /> {selecionado.contato.email}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                    <ListChecks className="size-4 text-primary" /> Exigências de
                    acesso
                  </p>
                  <ul className="flex flex-col gap-1 text-sm">
                    {selecionado.exigenciasAcesso.map((e, i) => (
                      <li key={i} className="text-muted-foreground">
                        • {e}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-1.5 text-sm font-medium">
                    Documentos necessários
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selecionado.documentosNecessarios.map((d, i) => (
                      <span
                        key={i}
                        className="rounded-md border bg-muted/40 px-2 py-0.5 text-xs"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="mb-2 text-sm font-medium">Projetos</p>
                  <ul className="flex flex-col gap-1.5">
                    {projetos
                      .filter((p) => p.clienteId === selecionado.id)
                      .map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/comercial?open=${p.id}`}
                            className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm transition-colors hover:bg-muted/60"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium hover:underline">
                                {p.nome}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {p.contrato}
                              </p>
                            </div>
                            <StatusBadge
                              status={projetoStatusMap[p.status].status}
                              className="shrink-0"
                            >
                              {projetoStatusMap[p.status].label}
                            </StatusBadge>
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
