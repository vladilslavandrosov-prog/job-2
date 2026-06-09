import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CompetencyRadar } from "./CompetencyRadar";
import type { TenderCompetencyItem, CompetencyItem } from "@shared/schema";
import { EXPERIENCE_LABELS, PROFICIENCY_LABELS } from "@shared/schema";

interface Props {
  tenderId: number;
  aiScore?: number | null;
  onScoreComputed?: (score: number) => void;
}

type Mode = "experience" | "proficiency";

// Цвета: индиго для требований, циан для профиля
export const REQ_COLOR = "#6366F1";
export const OUR_COLOR = "#06B6D4";

export function computeMatch(required: TenderCompetencyItem[], ours: CompetencyItem[]) {
  if (!required.length) return null;
  const map = new Map(ours.map((c) => [c.name, c]));
  let expSum = 0, profSum = 0;
  for (const req of required) {
    const our = map.get(req.name);
    const expOur = our?.experienceLevel ?? 0;
    const profOur = our?.proficiencyLevel ?? 0;
    expSum += Math.min(expOur / Math.max(req.experienceLevel, 1), 1);
    profSum += Math.min(profOur / Math.max(req.proficiencyLevel, 1), 1);
  }
  const expPct = Math.round((expSum / required.length) * 100);
  const profPct = Math.round((profSum / required.length) * 100);
  const avg = Math.round((expPct + profPct) / 2);
  return { expPct, profPct, avg };
}

export function computeAdjustedScore(_aiScore: number, matchAvg: number) {
  return matchAvg;
}

export function CompetencyPanel({ tenderId, aiScore, onScoreComputed }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<Mode>("experience");
  const [, setLocation] = useLocation();

  const { data: required = [], isLoading: loadingReq } = useQuery<TenderCompetencyItem[]>({
    queryKey: [`/api/tenders/${tenderId}/competencies`],
    queryFn: async () => {
      const r = await fetch(`/api/tenders/${tenderId}/competencies`, { credentials: "include" });
      return r.json();
    },
  });

  const { data: ours = [], isLoading: loadingOurs } = useQuery<CompetencyItem[]>({
    queryKey: ["/api/competencies/profile"],
    queryFn: async () => {
      const r = await fetch("/api/competencies/profile", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const hasRequired = Array.isArray(required) && required.length > 0;
  const hasOurs = Array.isArray(ours) && ours.length > 0;
  const match = hasRequired && hasOurs ? computeMatch(required, ours) : null;
  const adjustedScore = match && aiScore != null ? computeAdjustedScore(aiScore, match.avg) : null;

  // Notify parent once adjusted score is ready
  const reportedRef = useState<number | null>(null);
  if (adjustedScore != null && reportedRef[0] !== adjustedScore) {
    reportedRef[1](adjustedScore);
    onScoreComputed?.(adjustedScore);
  }

  // Группировка по направлениям
  const directions = hasRequired
    ? [...new Set(required.map((r) => r.direction))]
    : [];

  const scoreColor = adjustedScore != null
    ? adjustedScore >= 80 ? "#22C55E" : adjustedScore >= 60 ? "#F59E0B" : "#EF4444"
    : "var(--text-muted)";

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors text-left"
        style={{ background: "var(--bg-card)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>
            Результат сравнения AI анализа с нашим профилем
          </span>
          {match && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${OUR_COLOR}18`, color: OUR_COLOR }}>
                Опыт {match.expPct}%
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${REQ_COLOR}18`, color: REQ_COLOR }}>
                Владение {match.profPct}%
              </span>
            </div>
          )}
          {!hasRequired && !loadingReq && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>нет данных</span>
          )}
          {hasRequired && !hasOurs && !loadingOurs && (
            <button
              onClick={(e) => { e.stopPropagation(); setLocation("/competencies"); }}
              className="text-xs px-2 py-0.5 rounded-full font-medium transition-colors"
              style={{ background: `${REQ_COLOR}18`, color: REQ_COLOR, border: `1px solid ${REQ_COLOR}40` }}
            >
              + Добавить профиль
            </button>
          )}
        </div>
        <div className="shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t p-4 space-y-4" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
          {loadingReq || loadingOurs ? (
            <div className="flex items-center justify-center h-20 text-sm" style={{ color: "var(--text-muted)" }}>
              Загрузка...
            </div>
          ) : !hasRequired ? (
            <div className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
              Компетенции для этого тендера не определены
            </div>
          ) : (
            <>
              {/* Mode switcher */}
              <div className="flex justify-end">
                <div className="flex rounded-lg p-0.5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  {(["experience", "proficiency"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className="px-3 py-1 text-xs rounded-md transition-colors"
                      style={mode === m ? { background: "var(--primary)", color: "#fff" } : { color: "var(--text-muted)" }}
                    >
                      {m === "experience" ? "Опыт" : "Владение"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Radar */}
              <div className="rounded-lg p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <CompetencyRadar required={required} ours={ours} mode={mode} />
              </div>

              {/* List grouped by direction */}
              <div className="space-y-3">
                {directions.map((dir) => {
                  const items = required.filter((r) => r.direction === dir);
                  return (
                    <div key={dir}>
                      <p className="text-xs font-semibold mb-1.5 px-1" style={{ color: "var(--text-muted)" }}>
                        {dir}
                      </p>
                      <div className="space-y-1">
                        {items.map((req) => {
                          const our = ours.find((c) => c.name === req.name);
                          const reqVal = mode === "experience" ? req.experienceLevel : req.proficiencyLevel;
                          const ourVal = our ? (mode === "experience" ? our.experienceLevel : our.proficiencyLevel) : 0;
                          const labels = mode === "experience" ? EXPERIENCE_LABELS : PROFICIENCY_LABELS;
                          const status = !hasOurs ? null : ourVal >= reqVal ? "match" : ourVal >= reqVal - 1 ? "partial" : "gap";
                          const statusColor = status === "match" ? "#22C55E" : status === "partial" ? "#F59E0B" : "#EF4444";

                          return (
                            <div
                              key={req.name}
                              className="flex items-center justify-between px-3 py-2 rounded-md text-xs"
                              style={{ background: "var(--bg-card)", border: "1px solid var(--border-2)" }}
                            >
                              <span className="font-medium" style={{ color: "var(--text)" }}>{req.name}</span>
                              <div className="flex items-center gap-3 shrink-0 ml-2">
                                <span className="font-medium" style={{ color: REQ_COLOR }}>
                                  ● {labels[reqVal]}
                                </span>
                                {hasOurs && (
                                  <span className="font-medium" style={{ color: OUR_COLOR }}>
                                    ● {labels[ourVal]}
                                  </span>
                                )}
                                {hasOurs && status && (
                                  <span style={{ color: statusColor }}>
                                    {status === "match" ? "✓" : status === "partial" ? "≈" : "✗"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-4 text-xs pt-1" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1.5">
                  <span style={{ color: REQ_COLOR }}>●</span> Требование тендера
                </span>
                <span className="flex items-center gap-1.5">
                  <span style={{ color: OUR_COLOR }}>●</span> Наш профиль
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
