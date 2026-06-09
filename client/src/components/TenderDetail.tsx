import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, X, ArrowLeft, Building2, Calendar, Tag, Globe, Bookmark, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn, formatDate, getCategoryLabel, getScoreColor, getScoreBg } from "@/lib/utils";
import { CompetencyPanel } from "@/components/CompetencyPanel";
import { EXPERIENCE_LABELS, PROFICIENCY_LABELS } from "@shared/schema";
import type { Tender, TenderCompetencyItem, CompetencyItem } from "@shared/schema";

interface TenderDetailProps {
  tender: Tender;
  isSaved?: boolean;
  onClose?: () => void;
  onSave?: () => void;
}

// ── SVG radar generator ──────────────────────────────────────────────────────
const REQ_COLOR = "#6366F1";
const OUR_COLOR = "#06B6D4";
const CX = 160, CY = 160, R = 110;

function polar(angle: number, r: number) {
  const a = (angle - 90) * (Math.PI / 180);
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

function buildRadarSvg(
  items: { name: string; req: number; our: number }[],
  title: string,
  labels: readonly string[],
) {
  const n = items.length;
  if (n < 2) return "";
  const step = 360 / n;

  // Grid rings
  const rings = [1, 2, 3, 4, 5].map((lvl) => {
    const pts = items.map((_, i) => {
      const p = polar(i * step, (lvl / 5) * R);
      return `${p.x},${p.y}`;
    }).join(" ");
    return `<polygon points="${pts}" fill="none" stroke="#e5e7eb" stroke-width="1"/>`;
  }).join("\n");

  // Axes
  const axes = items.map((_, i) => {
    const p = polar(i * step, R);
    return `<line x1="${CX}" y1="${CY}" x2="${p.x}" y2="${p.y}" stroke="#e5e7eb" stroke-width="1"/>`;
  }).join("\n");

  // Labels
  const axisLabels = items.map((item, i) => {
    const p = polar(i * step, R + 22);
    const anchor = p.x < CX - 5 ? "end" : p.x > CX + 5 ? "start" : "middle";
    const shortName = item.name.length > 10 ? item.name.slice(0, 9) + "…" : item.name;
    return `<text x="${p.x}" y="${p.y}" text-anchor="${anchor}" dominant-baseline="middle" font-size="10" fill="#6b7280" font-family="Arial">${shortName}</text>`;
  }).join("\n");

  // Polygons
  function poly(vals: number[], color: string, opacity: number) {
    const pts = vals.map((v, i) => {
      const p = polar(i * step, (v / 5) * R);
      return `${p.x},${p.y}`;
    }).join(" ");
    return `<polygon points="${pts}" fill="${color}" fill-opacity="${opacity}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
  }

  const reqPoly = poly(items.map((i) => i.req), REQ_COLOR, 0.12);
  const ourPoly = poly(items.map((i) => i.our), OUR_COLOR, 0.18);

  // Dots
  const dots = items.flatMap((item, i) => [
    (() => { const p = polar(i * step, (item.req / 5) * R); return `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${REQ_COLOR}"/>`; })(),
    (() => { const p = polar(i * step, (item.our / 5) * R); return `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${OUR_COLOR}"/>`; })(),
  ]).join("\n");

  return `
<div style="display:flex;flex-direction:column;align-items:center">
  <div style="font-size:11px;font-weight:600;color:#6b7280;margin-bottom:8px">${title}</div>
  <svg width="320" height="320" viewBox="0 0 320 320">
    ${rings}
    ${axes}
    ${reqPoly}
    ${ourPoly}
    ${dots}
    ${axisLabels}
    <!-- Radius labels -->
    ${[1,2,3,4,5].map(lvl => {
      const p = polar(0, (lvl / 5) * R);
      return `<text x="${p.x + 4}" y="${p.y}" font-size="8" fill="#9ca3af" font-family="Arial">${labels[lvl]?.[0] ?? ""}</text>`;
    }).join("")}
  </svg>
  <div style="display:flex;gap:16px;font-size:11px;color:#6b7280;margin-top:4px">
    <span><span style="color:${REQ_COLOR};font-size:14px">●</span> Требование</span>
    <span><span style="color:${OUR_COLOR};font-size:14px">●</span> Наш профиль</span>
  </div>
</div>`;
}

// ── Table builder ────────────────────────────────────────────────────────────
function buildCompTable(
  required: TenderCompetencyItem[],
  ours: CompetencyItem[],
) {
  const oursMap = new Map(ours.map((c) => [c.name, c]));
  const directions = [...new Set(required.map((r) => r.direction))];

  const rows = directions.flatMap((dir) => {
    const header = `<tr><td colspan="5" style="background:#f3f4f6;padding:6px 10px;font-size:11px;font-weight:700;color:#374151">${dir}</td></tr>`;
    const items = required.filter((r) => r.direction === dir).map((req) => {
      const our = oursMap.get(req.name);
      const expReq = req.experienceLevel; const expOur = our?.experienceLevel ?? 0;
      const proReq = req.proficiencyLevel; const proOur = our?.proficiencyLevel ?? 0;
      const expOk = expOur >= expReq; const proOk = proOur >= proReq;
      const status = expOk && proOk ? "✓" : expOk || proOk ? "≈" : "✗";
      const statusColor = expOk && proOk ? "#16a34a" : expOk || proOk ? "#d97706" : "#dc2626";
      return `<tr>
        <td style="padding:6px 10px;font-size:12px">${req.name}</td>
        <td style="padding:6px 10px;font-size:11px;color:${REQ_COLOR}">${EXPERIENCE_LABELS[expReq]}</td>
        <td style="padding:6px 10px;font-size:11px;color:${OUR_COLOR}">${EXPERIENCE_LABELS[expOur]}</td>
        <td style="padding:6px 10px;font-size:11px;color:${REQ_COLOR}">${PROFICIENCY_LABELS[proReq]}</td>
        <td style="padding:6px 10px;font-size:11px;color:${OUR_COLOR}">${PROFICIENCY_LABELS[proOur]}</td>
        <td style="padding:6px 10px;font-size:13px;font-weight:700;color:${statusColor};text-align:center">${status}</td>
      </tr>`;
    });
    return [header, ...items];
  });

  return `
<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-family:Arial">
  <thead>
    <tr style="background:#6366f1">
      <th style="padding:8px 10px;text-align:left;font-size:11px;color:#fff;font-weight:600">Компетенция</th>
      <th style="padding:8px 10px;text-align:left;font-size:11px;color:#c7d2fe">Опыт (треб.)</th>
      <th style="padding:8px 10px;text-align:left;font-size:11px;color:#a5f3fc">Опыт (наш)</th>
      <th style="padding:8px 10px;text-align:left;font-size:11px;color:#c7d2fe">Владение (треб.)</th>
      <th style="padding:8px 10px;text-align:left;font-size:11px;color:#a5f3fc">Владение (наш)</th>
      <th style="padding:8px 10px;text-align:center;font-size:11px;color:#fff">Итог</th>
    </tr>
  </thead>
  <tbody>${rows.join("")}</tbody>
</table>`;
}

// ── Main print function ───────────────────────────────────────────────────────
function printTender(
  tender: Tender,
  score: number | null,
  required: TenderCompetencyItem[],
  ours: CompetencyItem[],
) {
  const scoreLabel = score != null
    ? score >= 90 ? "Отличное соответствие" : score >= 75 ? "Хорошее соответствие" : score >= 60 ? "Среднее соответствие" : "Низкое соответствие"
    : "";
  const scoreColor = score != null
    ? score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626"
    : "#6b7280";

  const hasCompetencies = required.length > 0 && ours.length > 0;

  const radarItems = (mode: "exp" | "pro") =>
    required.map((req) => {
      const our = ours.find((c) => c.name === req.name);
      return {
        name: req.name,
        req: mode === "exp" ? req.experienceLevel : req.proficiencyLevel,
        our: our ? (mode === "exp" ? our.experienceLevel : our.proficiencyLevel) : 0,
      };
    });

  const expRadar = hasCompetencies ? buildRadarSvg(radarItems("exp"), "Опыт (годы)", EXPERIENCE_LABELS) : "";
  const proRadar = hasCompetencies ? buildRadarSvg(radarItems("pro"), "Уровень владения", PROFICIENCY_LABELS) : "";
  const compTable = hasCompetencies ? buildCompTable(required, ours) : "";

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8"/>
<title>${tender.title}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; color: #111; font-size:13px; line-height:1.5; background:#fff; }
  .page { max-width:900px; margin:0 auto; padding:40px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:20px; border-bottom:3px solid #6366f1; margin-bottom:28px; }
  .logo { font-size:20px; font-weight:800; color:#6366f1; letter-spacing:-0.5px; }
  .logo span { color:#06b6d4; }
  .date-text { font-size:11px; color:#9ca3af; margin-top:4px; }
  h1 { font-size:22px; font-weight:700; color:#111827; line-height:1.3; margin-bottom:6px; }
  .subtitle { font-size:13px; color:#6b7280; margin-bottom:24px; }
  .score-block { display:flex; align-items:center; gap:20px; background:linear-gradient(135deg,#f5f3ff,#eff6ff); border:1px solid #e0e7ff; border-radius:12px; padding:20px; margin-bottom:24px; }
  .score-num { font-size:52px; font-weight:800; color:${scoreColor}; line-height:1; }
  .score-sub { font-size:11px; color:#9ca3af; }
  .score-right { flex:1 }
  .score-bar-bg { background:#e5e7eb; border-radius:6px; height:10px; width:100%; margin-bottom:8px; }
  .score-bar-fill { background:${scoreColor}; border-radius:6px; height:10px; width:${score ?? 0}%; }
  .score-match { font-size:14px; font-weight:600; color:${scoreColor}; }
  .meta-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:24px; }
  .meta-card { border:1px solid #e5e7eb; border-radius:10px; padding:14px; background:#fafafa; }
  .meta-card.full { grid-column:span 3; }
  .meta-card.half { grid-column:span 1; }
  .meta-lbl { font-size:10px; color:#9ca3af; text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
  .meta-val { font-size:14px; font-weight:600; color:#111827; }
  .badge { display:inline-block; background:#ede9fe; color:#6d28d9; border-radius:6px; padding:3px 10px; font-size:12px; font-weight:600; }
  .section { margin-bottom:28px; }
  .section-hdr { font-size:14px; font-weight:700; color:#374151; margin-bottom:12px; padding-bottom:6px; border-bottom:2px solid #e5e7eb; display:flex; align-items:center; gap:8px; }
  .section-hdr::before { content:''; display:inline-block; width:4px; height:16px; background:#6366f1; border-radius:2px; }
  .desc { font-size:12px; color:#4b5563; line-height:1.8; background:#f9fafb; border-radius:8px; padding:16px; border:1px solid #e5e7eb; }
  .radars { display:flex; gap:24px; justify-content:center; margin-bottom:8px; flex-wrap:wrap; }
  .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center; font-size:10px; color:#9ca3af; }
  .footer-logo { font-weight:700; color:#6366f1; font-size:12px; }
  @media print {
    .page { padding:20px; }
    .score-block { background:#f9fafb !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .section-hdr::before { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div>
      <div class="logo">Tender<span>Intel</span></div>
      <div class="date-text">Отчёт сформирован: ${new Date().toLocaleDateString("ru-RU", { day:"2-digit", month:"long", year:"numeric" })}</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#9ca3af">
      <div>${tender.platform}</div>
      <div>${tender.url}</div>
    </div>
  </div>

  <h1>${tender.title}</h1>
  <div class="subtitle">${tender.customer}</div>

  ${score != null ? `
  <div class="score-block">
    <div>
      <div class="score-num">${score}</div>
      <div class="score-sub">Наша оценка</div>
    </div>
    <div class="score-right">
      <div class="score-bar-bg"><div class="score-bar-fill"></div></div>
      <div class="score-match">${scoreLabel}</div>
      <div style="font-size:11px;color:#9ca3af;margin-top:4px">На основе сравнения профиля компетенций с требованиями тендера</div>
    </div>
  </div>` : ""}

  <div class="meta-grid">
    <div class="meta-card full">
      <div class="meta-lbl">Заказчик</div>
      <div class="meta-val">${tender.customer}</div>
    </div>
    ${tender.budget ? `<div class="meta-card"><div class="meta-lbl">Бюджет</div><div class="meta-val">${tender.budget}</div></div>` : ""}
    ${tender.deadline ? `<div class="meta-card"><div class="meta-lbl">Дедлайн</div><div class="meta-val">${new Date(tender.deadline).toLocaleDateString("ru-RU",{day:"2-digit",month:"long",year:"numeric"})}</div></div>` : ""}
    <div class="meta-card"><div class="meta-lbl">Площадка</div><div class="meta-val">${tender.platform}</div></div>
    <div class="meta-card"><div class="meta-lbl">Категория</div><div class="meta-val"><span class="badge">${getCategoryLabel(tender.category)}</span></div></div>
  </div>

  <div class="section">
    <div class="section-hdr">Описание тендера</div>
    <div class="desc">${tender.description}</div>
  </div>

  ${hasCompetencies ? `
  <div class="section">
    <div class="section-hdr">Анализ компетенций</div>
    <div class="radars">
      ${expRadar}
      ${proRadar}
    </div>
  </div>

  <div class="section">
    <div class="section-hdr">Детальное сравнение</div>
    ${compTable}
  </div>` : ""}

  <div class="footer">
    <div class="footer-logo">TenderIntel</div>
    <div>${tender.url}</div>
    <div>${new Date().toLocaleDateString("ru-RU")}</div>
  </div>

</div>
<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

// ── Component ────────────────────────────────────────────────────────────────
export function TenderDetail({ tender, isSaved, onClose, onSave }: TenderDetailProps) {
  const [adjustedScore, setAdjustedScore] = useState<number | null>(null);

  const { data: required = [] } = useQuery<TenderCompetencyItem[]>({
    queryKey: [`/api/tenders/${tender.id}/competencies`],
    queryFn: async () => {
      const r = await fetch(`/api/tenders/${tender.id}/competencies`, { credentials: "include" });
      return r.json();
    },
  });

  const { data: ours = [] } = useQuery<CompetencyItem[]>({
    queryKey: ["/api/competencies/profile"],
    queryFn: async () => {
      const r = await fetch("/api/competencies/profile", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      <div
        className="flex items-start justify-between p-4 md:p-5 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <button
          onClick={onClose}
          className="md:hidden flex items-center gap-2 transition-colors mr-3 shrink-0 mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-semibold leading-snug flex-1 pr-2" style={{ color: "var(--text)" }}>
          {tender.title}
        </h2>
        <button
          onClick={onClose}
          className="hidden md:block transition-colors shrink-0 mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 md:space-y-5 pb-24 md:pb-5">
        {adjustedScore != null && (
          <div
            className="flex items-center gap-4 p-4 rounded-lg"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="text-center shrink-0">
              <div className={cn("text-3xl font-bold", getScoreColor(adjustedScore))}>{adjustedScore}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Наша оценка</div>
            </div>
            <div className="flex-1">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--score-bar)" }}>
                <div className={cn("h-full rounded-full", getScoreBg(adjustedScore))} style={{ width: `${adjustedScore}%` }} />
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                {adjustedScore >= 90 ? "Отличное соответствие"
                  : adjustedScore >= 75 ? "Хорошее соответствие"
                  : adjustedScore >= 60 ? "Среднее соответствие"
                  : "Низкое соответствие"}
              </p>
            </div>
          </div>
        )}

        <CompetencyPanel tenderId={tender.id} aiScore={tender.aiScore} onScoreComputed={setAdjustedScore} />

        <div className="grid grid-cols-2 gap-3">
          <div
            className="p-3 rounded-lg col-span-2 sm:col-span-1"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              <Building2 size={12} />Заказчик
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{tender.customer}</p>
          </div>
          {tender.budget && (
            <div className="p-3 rounded-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Бюджет</div>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{tender.budget}</p>
            </div>
          )}
          {tender.deadline && (
            <div className="p-3 rounded-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                <Calendar size={12} />Дедлайн
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{formatDate(tender.deadline)}</p>
            </div>
          )}
          <div className="p-3 rounded-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              <Globe size={12} />Площадка
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{tender.platform}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            <Tag size={12} />Категория
          </div>
          <Badge variant="default">{getCategoryLabel(tender.category)}</Badge>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>Описание</h4>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{tender.description}</p>
        </div>
      </div>

      <div
        className="p-4 md:p-5 flex gap-3 shrink-0 mb-16 md:mb-0"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          className={cn("shrink-0", isSaved && "text-[#6366F1] border-[#6366F1]/50")}
        >
          <Bookmark size={15} className="mr-2" fill={isSaved ? "currentColor" : "none"} />
          {isSaved ? "Сохранено" : "Сохранить"}
        </Button>
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => printTender(tender, adjustedScore, required, ours)}>
          <Printer size={15} className="mr-2" />
          PDF
        </Button>
        <Button size="sm" asChild className="flex-1">
          <a href={tender.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={15} className="mr-2" />
            Открыть тендер
          </a>
        </Button>
      </div>
    </div>
  );
}
