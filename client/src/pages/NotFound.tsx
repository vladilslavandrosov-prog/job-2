import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F]">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-[#6366F1] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-[#F9FAFB] mb-2">Страница не найдена</h2>
        <p className="text-[#6B7280] mb-8">Запрошенная страница не существует</p>
        <Link href="/"><Button>На главную</Button></Link>
      </div>
    </div>
  );
}
