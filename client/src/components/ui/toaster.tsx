import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "./use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4 shadow-lg min-w-[300px] max-w-[400px] animate-in slide-in-from-bottom-2",
            t.variant === "destructive"
              ? "border-red-500/50 bg-red-950/90 text-red-200"
              : "border-[#2A2A3A] bg-[#13131A] text-[#F9FAFB]"
          )}
        >
          <div className="flex-1">
            {t.title && <p className="font-semibold text-sm">{t.title}</p>}
            {t.description && <p className="text-sm text-[#9CA3AF] mt-0.5">{t.description}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-[#6B7280] hover:text-[#F9FAFB] mt-0.5">
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
