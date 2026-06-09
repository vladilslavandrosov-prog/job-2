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
      className="p-4 rounded-lg border cursor-pointer transition-all"
      style={
        isSelected
          ? { borderColor: "rgba(99,102,241,0.6)", background: "rgba(99,102,241,0.06)" }
          : { borderColor: "var(--border)", background: "var(--bg-card)" }
      }
      onMouseEnter={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--text-muted)";
          (e.currentTarget as HTMLElement).style.background = "var(--border-2)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLElement).style.background = "var(--bg-card)";
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium line-clamp-2 mb-2" style={{ color: "var(--text)" }}>{tender.title}</h3>
          <div className="flex items-center gap-1.5 text-xs mb-3" style={{ color: "var(--text-muted)" }}>
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
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>Оценка</div>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onSave?.(); }}
            className="p-1.5 rounded-md transition-colors"
            style={isSaved ? { color: "var(--primary)", background: "rgba(99,102,241,0.1)" } : { color: "var(--text-muted)" }}
          >
            <Bookmark size={15} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      {tender.deadline && (
        <div
          className="flex items-center gap-1.5 text-xs mt-3 pt-3"
          style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}
        >
          <Calendar size={12} />
          <span>Дедлайн: {formatDate(tender.deadline)}</span>
        </div>
      )}
    </div>
  );
}
