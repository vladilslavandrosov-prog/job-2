import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { toast } from "@/components/ui/use-toast";
import { COMPETENCY_CATALOG, EXPERIENCE_LABELS, PROFICIENCY_LABELS } from "@shared/schema";
import type { CompetencyItem } from "@shared/schema";

const DIRECTIONS = [...new Set(COMPETENCY_CATALOG.map((c) => c.direction))];

function LevelSelect({
  value,
  onChange,
  labels,
  colorFn,
}: {
  value: number;
  onChange: (v: number) => void;
  labels: readonly string[];
  colorFn: (v: number) => string;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {labels.map((label, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className="px-2 py-1 rounded text-xs transition-all border"
          style={
            value === i
              ? { background: colorFn(i), color: "#fff", borderColor: colorFn(i), fontWeight: 600 }
              : { background: "var(--bg)", color: "var(--text-muted)", borderColor: "var(--border)" }
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function expColor(v: number) {
  const colors = ["#6B7280", "#3B82F6", "#06B6D4", "#8B5CF6", "#6366F1", "#4F46E5"];
  return colors[v] ?? "#6366F1";
}

function proColor(v: number) {
  const colors = ["#6B7280", "#84CC16", "#22C55E", "#10B981", "#F59E0B", "#EF4444"];
  return colors[v] ?? "#22C55E";
}

export default function CompetenciesPage() {
  const qc = useQueryClient();
  const [openDir, setOpenDir] = useState<string>(DIRECTIONS[0]);

  const { data: profile = [], isLoading } = useQuery<CompetencyItem[]>({
    queryKey: ["/api/competencies/profile"],
    queryFn: async () => {
      const r = await fetch("/api/competencies/profile", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  // Local editable state initialised from profile
  const [local, setLocal] = useState<CompetencyItem[] | null>(null);

  const items: CompetencyItem[] = local ?? (profile.length > 0
    ? profile
    : COMPETENCY_CATALOG.map((c) => ({ name: c.name, direction: c.direction, experienceLevel: 0, proficiencyLevel: 0 }))
  );

  const getItem = (name: string) => items.find((i) => i.name === name) ?? { name, direction: "", experienceLevel: 0, proficiencyLevel: 0 };

  const update = (name: string, direction: string, field: "experienceLevel" | "proficiencyLevel", value: number) => {
    const base = local ?? items;
    const exists = base.find((i) => i.name === name);
    if (exists) {
      setLocal(base.map((i) => i.name === name ? { ...i, [field]: value } : i));
    } else {
      setLocal([...base, { name, direction, experienceLevel: 0, proficiencyLevel: 0, [field]: value }]);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/competencies/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ competencies: local ?? items }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/competencies/profile"] });
      toast({ title: "Профиль компетенций сохранён" });
      setLocal(null);
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Ошибка", description: e.message }),
  });

  const isDirty = local !== null;

  const dirStats = (dir: string) => {
    const comps = COMPETENCY_CATALOG.filter((c) => c.direction === dir);
    const filled = comps.filter((c) => {
      const item = getItem(c.name);
      return item.experienceLevel > 0 || item.proficiencyLevel > 0;
    });
    return `${filled.length}/${comps.length}`;
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Наш профиль</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Укажите опыт и уровень владения — это используется для сравнения с требованиями тендеров
            </p>
          </div>
          <button
            onClick={() => save.mutate()}
            disabled={!isDirty || save.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={
              isDirty
                ? { background: "var(--primary)", color: "#fff", opacity: save.isPending ? 0.7 : 1 }
                : { background: "var(--border-2)", color: "var(--text-muted)", cursor: "not-allowed" }
            }
          >
            {save.isPending ? "Сохранение..." : isDirty ? "Сохранить изменения" : "Сохранено"}
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Direction tabs (left) */}
          <div
            className="w-52 shrink-0 overflow-y-auto py-3"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            {DIRECTIONS.map((dir) => (
              <button
                key={dir}
                onClick={() => setOpenDir(dir)}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between"
                style={
                  openDir === dir
                    ? { background: "rgba(99,102,241,0.1)", color: "var(--primary)", fontWeight: 600 }
                    : { color: "var(--text-muted)" }
                }
              >
                <span className="truncate">{dir}</span>
                <span
                  className="text-xs ml-1 shrink-0"
                  style={{ color: openDir === dir ? "var(--primary)" : "var(--text-muted)" }}
                >
                  {dirStats(dir)}
                </span>
              </button>
            ))}
          </div>

          {/* Competencies list */}
          <div className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-32" style={{ color: "var(--text-muted)" }}>
                Загрузка...
              </div>
            ) : (
              <div className="space-y-3 max-w-2xl">
                <div
                  className="grid text-xs font-medium px-4 pb-2"
                  style={{ color: "var(--text-muted)", gridTemplateColumns: "160px 1fr 1fr" }}
                >
                  <span>Компетенция</span>
                  <span>Опыт (годы)</span>
                  <span>Уровень владения</span>
                </div>

                {COMPETENCY_CATALOG.filter((c) => c.direction === openDir).map((cat) => {
                  const item = getItem(cat.name);
                  return (
                    <div
                      key={cat.name}
                      className="rounded-lg p-4"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                    >
                      <p className="text-sm font-medium mb-3" style={{ color: "var(--text)" }}>{cat.name}</p>
                      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        <div>
                          <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Опыт</p>
                          <LevelSelect
                            value={item.experienceLevel}
                            onChange={(v) => update(cat.name, cat.direction, "experienceLevel", v)}
                            labels={EXPERIENCE_LABELS}
                            colorFn={expColor}
                          />
                        </div>
                        <div>
                          <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Владение</p>
                          <LevelSelect
                            value={item.proficiencyLevel}
                            onChange={(v) => update(cat.name, cat.direction, "proficiencyLevel", v)}
                            labels={PROFICIENCY_LABELS}
                            colorFn={proColor}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
