import { Link, useLocation } from "wouter";
import { LayoutDashboard, CreditCard, LogOut, Zap, TrendingUp, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Тендеры", icon: LayoutDashboard },
  { href: "/billing", label: "Тарифы", icon: CreditCard },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <aside className="flex flex-col h-screen w-60 bg-[#13131A] border-r border-[#2A2A3A] px-3 py-4 shrink-0">
      <div className="flex items-center gap-2 px-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <span className="font-bold text-[#F9FAFB] text-lg">TenderAI</span>
      </div>

      <nav className="flex-1 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <a
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer",
                location === href
                  ? "bg-[#6366F1]/15 text-[#6366F1] font-medium"
                  : "text-[#9CA3AF] hover:bg-[#1A1A24] hover:text-[#F9FAFB]"
              )}
            >
              <Icon size={18} />
              {label}
            </a>
          </Link>
        ))}
      </nav>

      <div className="border-t border-[#2A2A3A] pt-4">
        <div className="px-3 mb-3">
          <p className="text-xs text-[#6B7280] mb-0.5">Тариф</p>
          <div className="flex items-center gap-1.5">
            {user?.plan === "pro" && <TrendingUp size={13} className="text-[#6366F1]" />}
            {user?.plan === "enterprise" && <Shield size={13} className="text-[#8B5CF6]" />}
            <span className="text-sm font-medium text-[#F9FAFB]">
              {user?.plan === "free" ? "Бесплатный" : user?.plan === "pro" ? "Pro" : "Enterprise"}
            </span>
          </div>
        </div>
        <div className="px-3 mb-3">
          <p className="text-sm font-medium text-[#F9FAFB] truncate">{user?.username}</p>
          <p className="text-xs text-[#6B7280] truncate">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-[#9CA3AF] hover:bg-[#1A1A24] hover:text-[#F9FAFB] transition-colors"
        >
          <LogOut size={18} />
          Выйти
        </button>
      </div>
    </aside>
  );
}
