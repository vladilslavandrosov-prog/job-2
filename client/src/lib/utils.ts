import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));
}

export const CATEGORY_LABELS: Record<string, string> = {
  all: "Все", development: "Разработка", mobile: "Мобильные",
  hardware: "Оборудование", support: "Поддержка", security: "ИБ",
  ai: "AI/ML", integration: "Интеграция", design: "Дизайн", consulting: "Консалтинг",
};

export function getCategoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] ?? cat;
}

export function getScoreColor(score: number) {
  if (score >= 90) return "text-green-400";
  if (score >= 75) return "text-yellow-400";
  if (score >= 60) return "text-orange-400";
  return "text-red-400";
}

export function getScoreBg(score: number) {
  if (score >= 90) return "bg-green-400";
  if (score >= 75) return "bg-yellow-400";
  if (score >= 60) return "bg-orange-400";
  return "bg-red-400";
}
