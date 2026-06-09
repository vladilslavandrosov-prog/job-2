import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, RefreshCw, SlidersHorizontal, Filter } from "lucide-react";
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
  const [showFilters, setShowFilters] = useState(false);

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

  const tenderList = Array.isArray(tenders) ? tenders : [];
  const savedIds = new Set((Array.isArray(saved) ? saved : []).map((t) => t.id));

  const toggleSave = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/saved/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/saved"] }),
    onError: (e: any) => toast({ variant: "destructive", title: "Ошибка", description: e.message }),
  });

  const filtersActive = category !== "all" || platform !== "all";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="md:hidden flex items-center gap-2 mr-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
          </div>

          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <Input
              placeholder="Поиск тендеров..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border transition-colors shrink-0"
            style={
              showFilters || filtersActive
                ? { background: "rgba(99,102,241,0.15)", borderColor: "rgba(99,102,241,0.5)", color: "var(--primary)" }
                : { borderColor: "var(--border)", color: "var(--text-muted)" }
            }
          >
            <SlidersHorizontal size={16} />
          </button>

          <span className="hidden md:block text-sm shrink-0" style={{ color: "var(--text-muted)" }}>
            {tenderList.length} тендеров
          </span>
        </header>

        {/* Mobile filters */}
        {showFilters && (
          <div
            className="md:hidden px-4 py-3 space-y-3"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}
          >
            <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0"
                  style={
                    category === cat
                      ? { background: "var(--primary)", color: "#fff" }
                      : { background: "var(--border-2)", color: "var(--text-muted)" }
                  }
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
            <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-none">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors shrink-0"
                  style={
                    platform === p
                      ? { background: "rgba(139,92,246,0.15)", color: "var(--accent)", border: "1px solid rgba(139,92,246,0.4)" }
                      : { background: "var(--border-2)", color: "var(--text-muted)", border: "1px solid transparent" }
                  }
                >
                  {p === "all" ? "Все площадки" : p}
                </button>
              ))}
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{tenderList.length} тендеров</p>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* List */}
          <div
            className={`flex flex-col overflow-hidden shrink-0 ${selected ? "hidden md:flex" : "flex"} w-full md:w-96`}
            style={{ borderRight: "1px solid var(--border)" }}
          >
            {/* Desktop filters */}
            <div
              className="hidden md:block p-4 space-y-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                    style={
                      category === cat
                        ? { background: "var(--primary)", color: "#fff" }
                        : { background: "var(--border-2)", color: "var(--text-muted)" }
                    }
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
                    className="px-2.5 py-1 rounded-full text-xs transition-colors"
                    style={
                      platform === p
                        ? { background: "rgba(139,92,246,0.15)", color: "var(--accent)", border: "1px solid rgba(139,92,246,0.4)" }
                        : { background: "var(--border-2)", color: "var(--text-muted)", border: "1px solid transparent" }
                    }
                  >
                    {p === "all" ? "Все площадки" : p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-20 md:pb-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-32" style={{ color: "var(--text-muted)" }}>
                  <RefreshCw size={18} className="animate-spin mr-2" /> Загрузка...
                </div>
              ) : tenderList.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-sm" style={{ color: "var(--text-muted)" }}>
                  Тендеры не найдены
                </div>
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

          {/* Detail */}
          {selected ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              <TenderDetail
                tender={selected}
                isSaved={savedIds.has(selected.id)}
                onClose={() => setSelected(null)}
                onSave={() => user && toggleSave.mutate(selected.id)}
              />
            </div>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(99,102,241,0.1)" }}
              >
                <Filter size={28} style={{ color: "var(--primary)" }} />
              </div>
              <h3 className="text-lg font-medium mb-2" style={{ color: "var(--text)" }}>Выберите тендер</h3>
              <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>
                Нажмите на любой тендер из списка, чтобы просмотреть подробную информацию
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
