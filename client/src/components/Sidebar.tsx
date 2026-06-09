import { Link, useLocation } from "wouter";
import { LayoutDashboard, CreditCard, LogOut, Zap, TrendingUp, Shield, Sun, Moon, BadgeCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Тендеры", icon: LayoutDashboard },
  { href: "/competencies", label: "Наш профиль", icon: BadgeCheck },
  { href: "/billing", label: "Тарифы", icon: CreditCard },
];

function ThemeToggle({ mobile }: { mobile?: boolean }) {
  const { theme, toggle } = useTheme();
  if (mobile) {
    return (
      <button
        onClick={toggle}
        className="flex flex-col items-center gap-1 flex-1 py-2.5 text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        Тема
      </button>
    );
  }
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors"
      style={{ color: "var(--text-muted)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--border-2)";
        (e.currentTarget as HTMLElement).style.color = "var(--text)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "";
        (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
      }}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
    </button>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col h-screen w-60 px-3 py-4 shrink-0"
        style={{ background: "var(--sidebar)", borderRight: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2 px-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg" style={{ color: "var(--text)" }}>TenderAI</span>
        </div>

        <nav className="flex-1 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer",
                  location === href ? "font-medium" : ""
                )}
                style={
                  location === href
                    ? { background: "rgba(99,102,241,0.12)", color: "var(--primary)" }
                    : { color: "var(--text-muted)" }
                }
                onMouseEnter={(e) => {
                  if (location !== href) {
                    (e.currentTarget as HTMLElement).style.background = "var(--border-2)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (location !== href) {
                    (e.currentTarget as HTMLElement).style.background = "";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                  }
                }}
              >
                <Icon size={18} />
                {label}
              </a>
            </Link>
          ))}
        </nav>

        <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="px-3 mb-3">
            <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Тариф</p>
            <div className="flex items-center gap-1.5">
              {user?.plan === "pro" && <TrendingUp size={13} style={{ color: "var(--primary)" }} />}
              {user?.plan === "enterprise" && <Shield size={13} style={{ color: "var(--accent)" }} />}
              <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                {user?.plan === "free" ? "Бесплатный" : user?.plan === "pro" ? "Pro" : "Enterprise"}
              </span>
            </div>
          </div>
          <div className="px-3 mb-3">
            <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{user?.username}</p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
          </div>
          <ThemeToggle />
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors mt-1"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--border-2)";
              (e.currentTarget as HTMLElement).style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "";
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            }}
          >
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center px-2 safe-bottom"
        style={{ background: "var(--sidebar)", borderTop: "1px solid var(--border)" }}
      >
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <a
              className="flex flex-col items-center gap-1 flex-1 py-2.5 text-xs transition-colors"
              style={{ color: location === href ? "var(--primary)" : "var(--text-muted)" }}
            >
              <Icon size={20} />
              {label}
            </a>
          </Link>
        ))}
        <ThemeToggle mobile />
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 flex-1 py-2.5 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          <LogOut size={20} />
          Выйти
        </button>
      </nav>
    </>
  );
}
