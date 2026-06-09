import { useState } from "react";
import { ExternalLink, X, ArrowLeft, Building2, Calendar, Tag, Globe, Bookmark, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn, formatDate, getCategoryLabel, getScoreColor, getScoreBg } from "@/lib/utils";
import { CompetencyPanel } from "@/components/CompetencyPanel";
import type { Tender } from "@shared/schema";

interface TenderDetailProps {
  tender: Tender;
  isSaved?: boolean;
  onClose?: () => void;
  onSave?: () => void;
}

function printTender(tender: Tender, score: number | null) {
  const scoreLabel = score != null
    ? score >= 90 ? "Отличное соответствие" : score >= 75 ? "Хорошее соответствие" : score >= 60 ? "Среднее соответствие" : "Низкое соответствие"
    : "";
  const scoreColor = score != null
    ? score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626"
    : "#6b7280";

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8"/>
<title>Тендер — ${tender.title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: #111; padding: 32px; font-size: 13px; line-height: 1.5; }
  h1 { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
  .score-block { display: flex; align-items: center; gap: 16px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .score-num { font-size: 36px; font-weight: 700; color: ${scoreColor}; line-height: 1; }
  .score-label { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .score-bar-bg { background: #e5e7eb; border-radius: 4px; height: 8px; width: 100%; }
  .score-bar-fill { background: ${scoreColor}; border-radius: 4px; height: 8px; width: ${score ?? 0}%; }
  .score-text { font-size: 12px; color: #6b7280; margin-top: 6px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .meta-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
  .meta-card.full { grid-column: span 2; }
  .meta-title { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
  .meta-value { font-size: 13px; font-weight: 600; }
  .badge { display: inline-block; background: #ede9fe; color: #6d28d9; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
  .section-title { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .desc { font-size: 12px; color: #4b5563; line-height: 1.7; }
  .footer { margin-top: 24px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; display: flex; justify-content: space-between; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <h1>${tender.title}</h1>
  ${score != null ? `
  <div class="score-block">
    <div>
      <div class="score-num">${score}</div>
      <div class="score-label">Наша оценка</div>
    </div>
    <div style="flex:1">
      <div class="score-bar-bg"><div class="score-bar-fill"></div></div>
      <div class="score-text">${scoreLabel}</div>
    </div>
  </div>` : ""}
  <div class="meta-grid">
    <div class="meta-card full">
      <div class="meta-title">Заказчик</div>
      <div class="meta-value">${tender.customer}</div>
    </div>
    ${tender.budget ? `<div class="meta-card"><div class="meta-title">Бюджет</div><div class="meta-value">${tender.budget}</div></div>` : ""}
    ${tender.deadline ? `<div class="meta-card"><div class="meta-title">Дедлайн</div><div class="meta-value">${new Date(tender.deadline).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}</div></div>` : ""}
    <div class="meta-card"><div class="meta-title">Площадка</div><div class="meta-value">${tender.platform}</div></div>
    <div class="meta-card"><div class="meta-title">Категория</div><div class="meta-value"><span class="badge">${getCategoryLabel(tender.category)}</span></div></div>
  </div>
  <div>
    <div class="section-title">Описание</div>
    <div class="desc">${tender.description}</div>
  </div>
  <div class="footer">
    <span>TenderIntel</span>
    <span>${tender.url}</span>
    <span>${new Date().toLocaleDateString("ru-RU")}</span>
  </div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

export function TenderDetail({ tender, isSaved, onClose, onSave }: TenderDetailProps) {
  const [adjustedScore, setAdjustedScore] = useState<number | null>(null);
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
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => printTender(tender, adjustedScore)}>
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
