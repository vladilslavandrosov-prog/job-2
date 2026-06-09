import { ExternalLink, X, ArrowLeft, Building2, Calendar, Tag, Globe, Bookmark } from "lucide-react";
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

export function TenderDetail({ tender, isSaved, onClose, onSave }: TenderDetailProps) {
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
        {tender.aiScore != null && (
          <div
            className="flex items-center gap-4 p-4 rounded-lg"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="text-center shrink-0">
              <div className={cn("text-3xl font-bold", getScoreColor(tender.aiScore))}>{tender.aiScore}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>AI Score</div>
            </div>
            <div className="flex-1">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--score-bar)" }}>
                <div className={cn("h-full rounded-full", getScoreBg(tender.aiScore))} style={{ width: `${tender.aiScore}%` }} />
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                {tender.aiScore >= 90 ? "Отличное соответствие"
                  : tender.aiScore >= 75 ? "Хорошее соответствие"
                  : tender.aiScore >= 60 ? "Среднее соответствие"
                  : "Низкое соответствие"}
              </p>
            </div>
          </div>
        )}

        <CompetencyPanel tenderId={tender.id} aiScore={tender.aiScore} />

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
