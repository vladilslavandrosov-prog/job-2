import { ExternalLink, X, Building2, Calendar, Tag, Globe, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn, formatDate, getCategoryLabel, getScoreColor, getScoreBg } from "@/lib/utils";
import type { Tender } from "@shared/schema";

interface TenderDetailProps {
  tender: Tender;
  isSaved?: boolean;
  onClose?: () => void;
  onSave?: () => void;
}

export function TenderDetail({ tender, isSaved, onClose, onSave }: TenderDetailProps) {
  return (
    <div className="flex flex-col h-full bg-[#0B0B0F]">
      <div className="flex items-start justify-between p-5 border-b border-[#2A2A3A]">
        <h2 className="text-base font-semibold text-[#F9FAFB] leading-snug flex-1 pr-4">{tender.title}</h2>
        <button onClick={onClose} className="text-[#6B7280] hover:text-[#F9FAFB] transition-colors shrink-0 mt-0.5">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {tender.aiScore != null && (
          <div className="flex items-center gap-4 p-4 rounded-lg bg-[#13131A] border border-[#2A2A3A]">
            <div className="text-center shrink-0">
              <div className={cn("text-3xl font-bold", getScoreColor(tender.aiScore))}>{tender.aiScore}</div>
              <div className="text-xs text-[#6B7280] mt-0.5">AI Score</div>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-[#2A2A3A] rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", getScoreBg(tender.aiScore))} style={{ width: `${tender.aiScore}%` }} />
              </div>
              <p className="text-xs text-[#6B7280] mt-2">
                {tender.aiScore >= 90 ? "Отличное соответствие" : tender.aiScore >= 75 ? "Хорошее соответствие" : tender.aiScore >= 60 ? "Среднее соответствие" : "Низкое соответствие"}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-[#13131A] border border-[#2A2A3A]">
            <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-1"><Building2 size={12} />Заказчик</div>
            <p className="text-sm text-[#F9FAFB] font-medium">{tender.customer}</p>
          </div>
          {tender.budget && (
            <div className="p-3 rounded-lg bg-[#13131A] border border-[#2A2A3A]">
              <div className="text-xs text-[#6B7280] mb-1">Бюджет</div>
              <p className="text-sm text-[#F9FAFB] font-medium">{tender.budget}</p>
            </div>
          )}
          {tender.deadline && (
            <div className="p-3 rounded-lg bg-[#13131A] border border-[#2A2A3A]">
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-1"><Calendar size={12} />Дедлайн</div>
              <p className="text-sm text-[#F9FAFB] font-medium">{formatDate(tender.deadline)}</p>
            </div>
          )}
          <div className="p-3 rounded-lg bg-[#13131A] border border-[#2A2A3A]">
            <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-1"><Globe size={12} />Площадка</div>
            <p className="text-sm text-[#F9FAFB] font-medium">{tender.platform}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-2"><Tag size={12} />Категория</div>
          <Badge variant="default">{getCategoryLabel(tender.category)}</Badge>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium text-[#D1D5DB] mb-2">Описание</h4>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">{tender.description}</p>
        </div>
      </div>

      <div className="p-5 border-t border-[#2A2A3A] flex gap-3">
        <Button variant="outline" size="sm" onClick={onSave} className={cn(isSaved && "text-[#6366F1] border-[#6366F1]/50")}>
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
