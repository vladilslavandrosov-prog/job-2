import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Filter, RefreshCw } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { TenderCard } from "@/components/TenderCard";
import { TenderDetail } from "@/components/TenderDetail";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/components/ui/use-toast";
import { CATEGORY_LABELS } from "@/lib/utils";
import type { Tender } from "@shared/schema";

const CATEGORIES = Object.keys(CATEGORY_LABELS);
const PLATFORMS = ["all", "zakupki.gov.ru", "sberbank-ast.ru", "roseltorg.ru"];

async function fetchJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, { credentials: "include" });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Request failed");
  if (!Array.isArray(data)) throw new Error("Expected array response");
  return data as T;
}

export default function TendersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [selected, setSelected] = useState<Tender | null>(null);

  const { data: tenders = [], isLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders", search, category, platform],
    queryFn: () => {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (category !== "all") p.set("category", category);
      if (platform !== "all") p.set("platform", platform);
      return fetchJSON<Tender[]>(`/api/tenders?${p}`);
    },
    retry: false,
  });

  const { data: saved = [] } = useQuery<Tender[]>({
    queryKey: ["/api/saved"],
    queryFn: () => fetchJSON<Tender[]>("/api/saved"),
    enabled: !!user,
    retry: false,
  });

  const savedIds = new Set((Array.isArray(saved) ? saved : []).map((t) => t.id));

  const toggleSave = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/saved/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/saved"] }),
    onError: (e: any) => toast({ variant: "destructive", title: "Ошибка", description: e.message }),
  });

  const tenderList = Array.isArray(tenders) ? tenders : [];

  return (
    <div className="flex h-screen bg-[#0B0B0F] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 px-6 py-4 border-b border-[#2A2A3A]">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <Input
              placeholder="Поиск тендеров..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-[#6B7280]">{tenderList.length} тендеров</span>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col w-96 border-r border-[#2A2A3A] overflow-hidden shrink-0">
            <div className="p-4 border-b border-[#2A2A3A] space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      category === cat ? "bg-[#6366F1] text-white" : "bg-[#1A1A24] text-[#9CA3AF] hover:bg-[#2A2A3A]"
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                      platform === p
                        ? "bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/40"
                        : "bg-[#1A1A24] text-[#9CA3AF] hover:bg-[#2A2A3A]"
                    }`}
                  >
                    {p === "all" ? "Все площадки" : p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-32 text-[#6B7280]">
                  <RefreshCw size={18} className="animate-spin mr-2" /> Загрузка...
                </div>
              ) : tenderList.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-[#6B7280] text-sm">Тендеры не найдены</div>
              ) : (
                tenderList.map((tender) => (
                  <TenderCard
                    key={tender.id}
                    tender={tender}
                    isSelected={selected?.id === tender.id}
                    isSaved={savedIds.has(tender.id)}
                    onClick={() => setSelected(tender)}
                    onSave={() => user && toggleSave.mutate(tender.id)}
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {selected ? (
              <TenderDetail
                tender={selected}
                isSaved={savedIds.has(selected.id)}
                onClose={() => setSelected(null)}
                onSave={() => user && toggleSave.mutate(selected.id)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-[#6366F1]/10 flex items-center justify-center mb-4">
                  <Filter size={28} className="text-[#6366F1]" />
                </div>
                <h3 className="text-lg font-medium text-[#F9FAFB] mb-2">Выберите тендер</h3>
                <p className="text-sm text-[#6B7280] max-w-xs">Нажмите на любой тендер из списка</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
