import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CompetencyRadar } from "./CompetencyRadar";
import type { TenderCompetencyItem, CompetencyItem } from "@shared/schema";
import { EXPERIENCE_LABELS, PROFICIENCY_LABELS } from "@shared/schema";

interface Props {
  tenderId: number;
}

type Mode = "experience" | "proficiency";

function MatchBadge({ required, ours, mode }: { required: TenderCompetencyItem[]; ours: CompetencyItem[]; mode: Mode }) {
  const oursMap = new Map(ours.map((c) => [c.name, c]));
  let match = 0;
  for (const req of required) {
    const our = oursMap.get(req.name);
    const reqVal = mode === "experience" ? req.experienceLevel : req.proficiencyLevel;
    const ourVal = our ? (mode === "experience" ? our.experienceLevel : our.proficiencyLevel) : 0;
    if (ourVal >= reqVal - 1) match++;
  }
  const pct = required.length > 0 ? Math.round((match / required.length) * 100) : 0;
  const color = pct >= 80 ? "#22C55E" : pct >= 50 ? "#F59E0B" : "#EF4444";
  const label = mode === "experience" ? "Опыт" : "Владение";
  return (
    <span className="text-xs font-medium" style={{ color }}>
      {label}: {match}/{required.length} ({pct}%)
    </span>
  );
}

export function CompetencyPanel({ tenderId }: Props) {
  const [mode, setMode] = useState<Mode>("experience");

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

  if (loadingReq || loadingOurs) {
    return (
      <div className="flex items-center justify-center h-24" style={{ color: "var(--text-muted)" }}>
        <span className="text-sm">Загрузка компетенций...</span>
      </div>
    );
  }

  if (!Array.isArray(required) || required.length === 0) {
    return (
      <div
        className="rounded-lg p-4 text-center text-sm"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
      >
        Компетенции для этого тендера не определены
      </div>
    );
  }

  const hasOurs = Array.isArray(ours) && ours.length > 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>📊 Компетенции</span>
          {hasOurs && (
            <div className="flex gap-3">
              <MatchBadge required={required} ours={ours} mode="experience" />
              <MatchBadge required={required} ours={ours} mode="proficiency" />
            </div>
          )}
        </div>
        {/* Mode switcher */}
        <div
          className="flex rounded-lg p-0.5"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          {(["experience", "proficiency"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-3 py-1 text-xs rounded-md transition-colors"
              style={
                mode === m
                  ? { background: "var(--primary)", color: "#fff" }
                  : { color: "var(--text-muted)" }
              }
            >
              {m === "experience" ? "Опыт (годы)" : "Уровень владения"}
            </button>
          ))}
        </div>
      </div>

      {/* No profile warning */}
      {!hasOurs && (
        <div
          className="rounded-lg p-3 text-sm flex items-center gap-3"
          style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)" }}
        >
          <span>🟢</span>
          <div>
            <p style={{ color: "var(--text)" }} className="font-medium">Добавьте профиль вашей команды</p>
            <p style={{ color: "var(--text-muted)" }} className="text-xs">Зелёный контур покажет насколько вы соответствуете требованиям</p>
          </div>
        </div>
      )}

      {/* Single radar for current mode */}
      <div
        className="rounded-lg p-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <CompetencyRadar required={required} ours={ours} mode={mode} />
      </div>

      {/* Competency list */}
      <div className="space-y-1">
        {required.map((req) => {
          const our = ours.find((c) => c.name === req.name);
          const reqVal = mode === "experience" ? req.experienceLevel : req.proficiencyLevel;
          const ourVal = our ? (mode === "experience" ? our.experienceLevel : our.proficiencyLevel) : 0;
          const labels = mode === "experience" ? EXPERIENCE_LABELS : PROFICIENCY_LABELS;
          const status = !hasOurs ? null : ourVal >= reqVal ? "match" : ourVal >= reqVal - 1 ? "partial" : "gap";
          const statusIcon = status === "match" ? "✅" : status === "partial" ? "⚠️" : status === "gap" ? "❌" : "•";
          const statusColor = status === "match" ? "#22C55E" : status === "partial" ? "#F59E0B" : status === "gap" ? "#EF4444" : "var(--text-muted)";

          return (
            <div
              key={req.name}
              className="flex items-center justify-between px-3 py-2 rounded-md text-xs"
              style={{ background: "var(--bg)", border: "1px solid var(--border-2)" }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span>{statusIcon}</span>
                <span className="font-medium truncate" style={{ color: "var(--text)" }}>{req.name}</span>
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{req.direction}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span style={{ color: "#EF4444" }}>🔴 {labels[reqVal]}</span>
                {hasOurs && <span style={{ color: "#22C55E" }}>🟢 {labels[ourVal]}</span>}
                {hasOurs && <span style={{ color: statusColor }}>{status === "match" ? "Соответствует" : status === "partial" ? "Частично" : "Разрыв"}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
