import { useState, useEffect } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TenderCompetencyItem, CompetencyItem } from "@shared/schema";
import { EXPERIENCE_LABELS, PROFICIENCY_LABELS } from "@shared/schema";
import { REQ_COLOR, OUR_COLOR } from "./CompetencyPanel";

interface Props {
  required: TenderCompetencyItem[];
  ours: CompetencyItem[];
  mode: "experience" | "proficiency";
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const req = payload.find((p: TooltipPayload) => p.name === "Требование");
  const our = payload.find((p: TooltipPayload) => p.name === "Наш профиль");
  const mode = payload[0]?.payload?._mode as "experience" | "proficiency";
  const labels = mode === "experience" ? EXPERIENCE_LABELS : PROFICIENCY_LABELS;

  const reqVal = req?.value ?? 0;
  const ourVal = our?.value ?? 0;
  const match = ourVal >= reqVal ? "✅ Соответствует" : ourVal >= reqVal - 1 ? "⚠️ Частично" : "❌ Разрыв";
  const matchColor = ourVal >= reqVal ? "#22C55E" : ourVal >= reqVal - 1 ? "#F59E0B" : "#EF4444";

  return (
    <div
      className="rounded-lg p-3 text-xs shadow-lg"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", minWidth: 180 }}
    >
      <p className="font-semibold mb-2" style={{ color: "var(--text)" }}>{label}</p>
      {req && (
        <p style={{ color: "#EF4444" }}>
          🔴 Требование: <span className="font-medium">{labels[reqVal]}</span>
        </p>
      )}
      {our && (
        <p style={{ color: "#22C55E" }}>
          🟢 Наша команда: <span className="font-medium">{labels[ourVal]}</span>
        </p>
      )}
      {req && our && (
        <p className="mt-1.5 font-medium" style={{ color: matchColor }}>{match}</p>
      )}
    </div>
  );
}

export function CompetencyRadar({ required, ours, mode }: Props) {
  // Force re-render after mount so ResponsiveContainer gets real parent width
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 50); return () => clearTimeout(t); }, []);

  const oursMap = new Map(ours.map((c) => [c.name, c]));

  const data = required.map((req) => {
    const our = oursMap.get(req.name);
    const reqVal = mode === "experience" ? req.experienceLevel : req.proficiencyLevel;
    const ourVal = our ? (mode === "experience" ? our.experienceLevel : our.proficiencyLevel) : 0;
    return {
      name: req.name.length > 12 ? req.name.slice(0, 11) + "…" : req.name,
      fullName: req.name,
      required: reqVal,
      ours: ourVal,
      _mode: mode,
    };
  });

  const title = mode === "experience" ? "Опыт (годы)" : "Уровень владения";
  const labels = mode === "experience" ? EXPERIENCE_LABELS : PROFICIENCY_LABELS;

  if (!ready) return <div style={{ height: 280 }} />;

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-muted)" }}>{title}</p>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          />
          <PolarRadiusAxis
            domain={[0, 5]}
            tickCount={6}
            tick={{ fill: "var(--text-muted)", fontSize: 9 }}
            tickFormatter={(v: number) => labels[v]?.[0] ?? ""}
            axisLine={false}
          />
          <Radar
            name="Требование"
            dataKey="required"
            stroke={REQ_COLOR}
            fill={REQ_COLOR}
            fillOpacity={0.12}
            dot={{ r: 4, fill: REQ_COLOR, strokeWidth: 0 }}
          />
          <Radar
            name="Наш профиль"
            dataKey="ours"
            stroke={OUR_COLOR}
            fill={OUR_COLOR}
            fillOpacity={0.12}
            dot={{ r: 4, fill: OUR_COLOR, strokeWidth: 0 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
