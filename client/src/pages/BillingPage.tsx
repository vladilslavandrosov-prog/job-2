import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Zap, TrendingUp, Shield } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "free", name: "Бесплатный", price: "0 ₽", period: "навсегда",
    icon: Zap, color: "#6B7280",
    features: ["До 20 тендеров в день", "Базовый поиск", "1 площадка", "AI Score"],
  },
  {
    id: "pro", name: "Pro", price: "2 990 ₽", period: "в месяц",
    icon: TrendingUp, color: "#6366F1", popular: true,
    features: ["Неограниченные тендеры", "Расширенный поиск", "Все площадки", "AI Score + рекомендации", "Сохранение тендеров", "Email-уведомления"],
  },
  {
    id: "enterprise", name: "Enterprise", price: "14 990 ₽", period: "в месяц",
    icon: Shield, color: "#8B5CF6",
    features: ["Всё из Pro", "API доступ", "Команда до 10 человек", "Персональный менеджер", "SLA 99.9%", "Кастомные интеграции"],
  },
];

export default function BillingPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const upgrade = useMutation({
    mutationFn: (plan: string) => apiRequest("POST", "/api/billing/upgrade", { plan }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Тариф обновлён" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Ошибка", description: e.message }),
  });

  return (
    <div className="flex h-screen bg-[#0B0B0F] overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          <div className="text-center mb-8 md:mb-10">
            <h1 className="text-2xl md:text-3xl font-bold text-[#F9FAFB] mb-2">Тарифные планы</h1>
            <p className="text-[#6B7280]">Выберите подходящий план для вашего бизнеса</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isCurrent = user?.plan === plan.id;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-xl border p-6 flex flex-col",
                    plan.popular ? "border-[#6366F1]/60 bg-[#6366F1]/5" : "border-[#2A2A3A] bg-[#13131A]"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#6366F1] text-white text-xs font-medium rounded-full">
                      Популярный
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${plan.color}20` }}>
                      <Icon size={20} style={{ color: plan.color }} />
                    </div>
                    <h3 className="font-semibold text-[#F9FAFB]">{plan.name}</h3>
                  </div>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-[#F9FAFB]">{plan.price}</span>
                    <span className="text-[#6B7280] text-sm ml-2">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-[#D1D5DB]">
                        <Check size={14} style={{ color: plan.color }} className="shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button variant="outline" disabled className="w-full">Текущий план</Button>
                  ) : (
                    <Button
                      onClick={() => upgrade.mutate(plan.id)}
                      disabled={upgrade.isPending}
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.id === "free" ? "Перейти на Free" : `Подключить ${plan.name}`}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
