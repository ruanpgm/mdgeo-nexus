import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/mtgl/app-sidebar";
import { AppTopbar } from "@/components/mtgl/app-topbar";
import { DataStoreProvider } from "@/lib/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataStoreProvider>
      <SidebarProvider>
        <AppSidebar />
        {/*
          min-w-0 nos dois: por padrão um item flex tem min-width:auto, que
          impede encolher abaixo do min-content dos DESCENDENTES. Uma página
          com tabela larga faz esse item crescer até estourar por cima do
          espaço da sidebar — os overflow-x-auto internos de cada tabela não
          bastam se o container que os envolve não pode encolher primeiro.
          Só ficou visível quando uma página (Segurança) passou a ter altura
          suficiente para gerar scroll vertical na janela.
        */}
        <SidebarInset className="min-w-0">
          <AppTopbar />
          <main className="flex min-w-0 flex-1 flex-col gap-4 bg-muted/20 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DataStoreProvider>
  );
}
