"use client";

/**
 * Store client-side para os dados que ganham CRUD no mockup. Não existe
 * backend — o estado inicial vem de `mock-data.ts`, mas a partir do primeiro
 * clique passa a viver aqui, em memória, compartilhado por todas as páginas
 * via Context. Some ao recarregar a página; esse é o trade-off aceito para
 * um mockup de demonstração (ver docs/projeto-abas.md).
 *
 * Novas fatias (colaboradores, equipamentos, veículos, compras, checklists…)
 * entram aqui seguindo o mesmo padrão conforme cada aba ganha CRUD.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  aditivosContrato as aditivosIniciais,
  contratos as contratosIniciais,
  etapasRoadmap as etapasIniciais,
  projetos as projetosIniciais,
} from "./mock-data";
import type { AditivoContrato, Contrato, EtapaRoadmap, Projeto } from "./types";

let proximoId = 100;
/** Ids sintéticos para registros criados na sessão — nunca colidem com os ids fixos do mock (proj-01..07 etc). */
function novoId(prefixo: string) {
  proximoId += 1;
  return `${prefixo}-novo-${proximoId}`;
}

type DataStore = {
  projetos: Projeto[];
  contratos: Contrato[];
  aditivosContrato: AditivoContrato[];
  etapasRoadmap: EtapaRoadmap[];

  criarProjeto: (p: Omit<Projeto, "id">) => string;
  atualizarProjeto: (id: string, patch: Partial<Projeto>) => void;
  excluirProjeto: (id: string) => void;
  iniciarProjeto: (id: string) => void;

  atualizarContrato: (projetoId: string, patch: Partial<Contrato>) => void;
  alternarItemChecklistContrato: (projetoId: string, indice: number) => void;

  criarAditivo: (a: Omit<AditivoContrato, "id">) => void;
  atualizarAditivo: (id: string, patch: Partial<AditivoContrato>) => void;
  excluirAditivo: (id: string) => void;

  criarEtapaRoadmap: (e: Omit<EtapaRoadmap, "id">) => void;
  atualizarEtapaRoadmap: (id: string, patch: Partial<EtapaRoadmap>) => void;
  excluirEtapaRoadmap: (id: string) => void;
};

const DataStoreContext = createContext<DataStore | null>(null);

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const [projetos, setProjetos] = useState<Projeto[]>(projetosIniciais);
  const [contratos, setContratos] = useState<Contrato[]>(contratosIniciais);
  const [aditivosContrato, setAditivosContrato] =
    useState<AditivoContrato[]>(aditivosIniciais);
  const [etapasRoadmap, setEtapasRoadmap] =
    useState<EtapaRoadmap[]>(etapasIniciais);

  const criarProjeto = useCallback((p: Omit<Projeto, "id">) => {
    const id = novoId("proj");
    setProjetos((prev) => [...prev, { ...p, id }]);
    return id;
  }, []);

  const atualizarProjeto = useCallback(
    (id: string, patch: Partial<Projeto>) => {
      setProjetos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
    },
    [],
  );

  const excluirProjeto = useCallback((id: string) => {
    setProjetos((prev) => prev.filter((p) => p.id !== id));
    setContratos((prev) => prev.filter((c) => c.projetoId !== id));
    setAditivosContrato((prev) => prev.filter((a) => a.projetoId !== id));
    setEtapasRoadmap((prev) => prev.filter((e) => e.projetoId !== id));
  }, []);

  const iniciarProjeto = useCallback((id: string) => {
    setProjetos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "em_andamento" } : p)),
    );
  }, []);

  const atualizarContrato = useCallback(
    (projetoId: string, patch: Partial<Contrato>) => {
      setContratos((prev) => {
        const existe = prev.some((c) => c.projetoId === projetoId);
        if (!existe) {
          return [
            ...prev,
            {
              projetoId,
              objeto: "",
              briefing: "",
              prazoExecucao: "",
              condicoesPagamento: "",
              impeditivos: [],
              checklist: [],
              ...patch,
            },
          ];
        }
        return prev.map((c) =>
          c.projetoId === projetoId ? { ...c, ...patch } : c,
        );
      });
    },
    [],
  );

  const alternarItemChecklistContrato = useCallback(
    (projetoId: string, indice: number) => {
      setContratos((prev) =>
        prev.map((c) =>
          c.projetoId === projetoId
            ? {
                ...c,
                checklist: c.checklist.map((item, i) =>
                  i === indice ? { ...item, concluido: !item.concluido } : item,
                ),
              }
            : c,
        ),
      );
    },
    [],
  );

  const criarAditivo = useCallback((a: Omit<AditivoContrato, "id">) => {
    setAditivosContrato((prev) => [...prev, { ...a, id: novoId("adt") }]);
  }, []);

  const atualizarAditivo = useCallback(
    (id: string, patch: Partial<AditivoContrato>) => {
      setAditivosContrato((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      );
    },
    [],
  );

  const excluirAditivo = useCallback((id: string) => {
    setAditivosContrato((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const criarEtapaRoadmap = useCallback((e: Omit<EtapaRoadmap, "id">) => {
    setEtapasRoadmap((prev) => [...prev, { ...e, id: novoId("rm") }]);
  }, []);

  const atualizarEtapaRoadmap = useCallback(
    (id: string, patch: Partial<EtapaRoadmap>) => {
      setEtapasRoadmap((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      );
    },
    [],
  );

  const excluirEtapaRoadmap = useCallback((id: string) => {
    setEtapasRoadmap((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const value = useMemo<DataStore>(
    () => ({
      projetos,
      contratos,
      aditivosContrato,
      etapasRoadmap,
      criarProjeto,
      atualizarProjeto,
      excluirProjeto,
      iniciarProjeto,
      atualizarContrato,
      alternarItemChecklistContrato,
      criarAditivo,
      atualizarAditivo,
      excluirAditivo,
      criarEtapaRoadmap,
      atualizarEtapaRoadmap,
      excluirEtapaRoadmap,
    }),
    [
      projetos,
      contratos,
      aditivosContrato,
      etapasRoadmap,
      criarProjeto,
      atualizarProjeto,
      excluirProjeto,
      iniciarProjeto,
      atualizarContrato,
      alternarItemChecklistContrato,
      criarAditivo,
      atualizarAditivo,
      excluirAditivo,
      criarEtapaRoadmap,
      atualizarEtapaRoadmap,
      excluirEtapaRoadmap,
    ],
  );

  return (
    <DataStoreContext.Provider value={value}>
      {children}
    </DataStoreContext.Provider>
  );
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext);
  if (!ctx)
    throw new Error("useDataStore precisa estar dentro de <DataStoreProvider>");
  return ctx;
}
