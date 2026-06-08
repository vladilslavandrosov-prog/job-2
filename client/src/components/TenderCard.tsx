import { Bookmark, Calendar, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, getCategoryLabel, getScoreColor } from "@/lib/utils";
import type { Tender } from "@shared/schema";

interface TenderCardProps {
  tender: Tender;
  isSelected?: boolean;
  isSaved?: boolean;
  onClick?: () => void;
  onSave?: () => void;
}

export function TenderCard({ tender, isSelected, isSaved, onClick, onSave }: TenderCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg border cursor-pointer transition-all",
        isSelected
          ? "border-[#6366F1]/60 bg-[#6366F1]/5"
          : "border-[#2A2A3A] bg-[#13131A] hover:border-[#3A3A4A] hover:bg-[#1A1A24]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-[#F9FAFB] line-clamp-2 mb-2">{tender.title}</h3>
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-3">
            <Building2 size={12} />
            <span className="truncate">{tender.customer}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="default">{getCategoryLabel(tender.category)}</Badge>
            <Badge variant="secondary">{tender.platform}</Badge>
            {tender.budget && <Badge variant="outline">{tender.budget}</Badge>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {tender.aiScore != null && (
            <div className="text-center">
              <div className={cn("text-lg font-bold", getScoreColor(tender.aiScore))}>{tender.aiScore}</div>
              <div className="text-[10px] text-[#6B7280]">AI Score</div>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onSave?.(); }}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              isSaved ? "text-[#6366F1] bg-[#6366F1]/10" : "text-[#6B7280] hover:text-[#F9FAFB] hover:bg-[#2A2A3A]"
            )}
          >
            <Bookmark size={15} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      {tender.deadline && (
        <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mt-3 pt-3 border-t border-[#2A2A3A]">
          <Calendar size={12} />
          <span>Дедлайн: {formatDate(tender.deadline)}</span>
        </div>
      )}
    </div>
  );
}
