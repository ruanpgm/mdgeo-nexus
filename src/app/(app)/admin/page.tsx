"use client";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ActivitySquare,
  CheckCircle2,
  KeyRound,
  Laptop,
  Lock,
  LogIn,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { servicoSistemaStatusMap } from "@/lib/status-map";
import {
  HOJE,
  getColaboradorNome,
  logsAcesso,
  servicosSistema,
  sessoesAtivas,
} from "@/lib/mock-data";

export default function AdminPage() {
  const logsHoje = logsAcesso.filter((l) => l.dataHora.startsWith(HOJE));
  const falhas = logsAcesso.filter((l) => !l.sucesso).length;
  const usuariosUnicos = new Set(logsAcesso.map((l) => l.colaboradorId)).size;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Painel Admin"
        description="Controle do sistema — acesso, saúde e segurança da informação. Não inclui dados operacionais da empresa."
      />

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">Logs de Acesso</TabsTrigger>
          <TabsTrigger value="saude">Saúde do Sistema</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança do Sistema</TabsTrigger>
        </TabsList>

        {/* LOGS DE ACESSO */}
        <TabsContent value="logs" className="mt-4 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard
              label="Eventos hoje"
              value={logsHoje.length}
              icon={LogIn}
            />
            <KpiCard
              label="Usuários únicos"
              value={usuariosUnicos}
              icon={Laptop}
            />
            <KpiCard
              label="Falhas de login"
              value={falhas}
              icon={XCircle}
              tone={falhas > 0 ? "warning" : "success"}
            />
            <KpiCard
              label="Logins bem-sucedidos"
              value={logsAcesso.filter((l) => l.sucesso).length}
              icon={CheckCircle2}
              tone="success"
            />
          </div>

          <Card>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsAcesso.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-mono text-xs tabular-nums">
                          {l.dataHora}
                        </TableCell>
                        <TableCell className="font-medium">
                          {getColaboradorNome(l.colaboradorId)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {l.acao}
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                          {l.ip}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {l.local}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {l.dispositivo}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={l.sucesso ? "ok" : "critico"}>
                            {l.sucesso ? "Sucesso" : "Falha"}
                          </StatusBadge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SAÚDE DO SISTEMA */}
        <TabsContent value="saude" className="mt-4 flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            {servicosSistema.map((s) => {
              const map = servicoSistemaStatusMap[s.status];
              return (
                <Card key={s.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ActivitySquare className="size-4 text-muted-foreground" />{" "}
                        {s.nome}
                      </CardTitle>
                      <StatusBadge status={map.status}>{map.label}</StatusBadge>
                    </div>
                    <CardDescription>{s.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Uptime (30 dias)
                    </span>
                    <span className="font-mono tabular-nums">
                      {s.uptimePct}%
                    </span>
                  </CardContent>
                  <CardContent className="flex items-center justify-between pt-0 text-xs text-muted-foreground">
                    <span>Última verificação</span>
                    <span className="font-mono tabular-nums">
                      {s.ultimaVerificacao}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* SEGURANÇA DO SISTEMA */}
        <TabsContent value="seguranca" className="mt-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sessões ativas</CardTitle>
              <CardDescription>
                Quem está autenticado no sistema agora
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Iniciado em</TableHead>
                      <TableHead>Último acesso</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessoesAtivas.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {getColaboradorNome(s.colaboradorId)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.dispositivo}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.local}
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums">
                          {s.iniciadoEm}
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums">
                          {s.ultimoAcesso}
                        </TableCell>
                        <TableCell>
                          {s.atual ? (
                            <StatusBadge status="info">
                              Sessão atual
                            </StatusBadge>
                          ) : (
                            <StatusBadge status="ok">Ativa</StatusBadge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="size-4 text-muted-foreground" /> Política de
                segurança
              </CardTitle>
              <CardDescription>
                Regras vigentes de autenticação e sessão
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2 text-sm">
                <KeyRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>
                  Senha mínima de 10 caracteres, com renovação a cada 90 dias.
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>
                  Autenticação em duas etapas obrigatória para o grupo Admin.
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Laptop className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>Sessão expira após 12h de inatividade.</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <XCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>
                  3 tentativas de login com falha bloqueiam a conta por 15
                  minutos.
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
