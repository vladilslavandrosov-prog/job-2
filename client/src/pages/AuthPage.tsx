import { useState } from "react";
import { useForm } from "react-hook-form";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "@/components/ui/use-toast";

type LoginForm = { username: string; password: string };
type RegisterForm = { username: string; email: string; password: string };

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const { login, register: reg } = useAuth();

  const lf = useForm<LoginForm>();
  const rf = useForm<RegisterForm>();

  const handleLogin = lf.handleSubmit(async (d) => {
    setLoading(true);
    try { await login(d.username, d.password); }
    catch (e: any) { toast({ variant: "destructive", title: "Ошибка", description: e.message }); }
    finally { setLoading(false); }
  });

  const handleRegister = rf.handleSubmit(async (d) => {
    setLoading(true);
    try { await reg(d.username, d.email, d.password); }
    catch (e: any) { toast({ variant: "destructive", title: "Ошибка", description: e.message }); }
    finally { setLoading(false); }
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>TenderAI</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>AI-агрегатор ИТ-тендеров</p>
          </div>
        </div>

        <div
          className="rounded-xl p-6"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex rounded-lg p-1 mb-6"
            style={{ background: "var(--bg)" }}
          >
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 text-sm font-medium rounded-md transition-colors"
                style={
                  tab === t
                    ? { background: "var(--primary)", color: "#fff" }
                    : { color: "var(--text-muted)" }
                }
              >
                {t === "login" ? "Вход" : "Регистрация"}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Имя пользователя</Label>
                <Input placeholder="username" {...lf.register("username", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Пароль</Label>
                <Input type="password" placeholder="••••••••" {...lf.register("password", { required: true })} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Вход..." : "Войти"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label>Имя пользователя</Label>
                <Input placeholder="username" {...rf.register("username", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" {...rf.register("email", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Пароль</Label>
                <Input type="password" placeholder="Минимум 6 символов" {...rf.register("password", { required: true, minLength: 6 })} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Регистрация..." : "Зарегистрироваться"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
