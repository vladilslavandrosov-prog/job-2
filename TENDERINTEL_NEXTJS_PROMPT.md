# TenderIntel — Промт для новой сессии (репозиторий job-3)

## Контекст

Ты — Claude Code в новом репозитории `vladilslavandrosov-prog/job-3`.
Задача: построить публичный SaaS-продукт **TenderIntel** — AI-агрегатор ИТ-тендеров для B2B рынка.

Есть рабочий прототип в `vladilslavandrosov-prog/job-2` (Vite + React + Express) —
оттуда берём **только дизайн и UI-компоненты**. Вся архитектура в job-3 новая.

---

## Стек

| Слой | Технология |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Стили | Tailwind CSS + CSS-переменные (тёмная/светлая тема) |
| UI-компоненты | shadcn/ui + lucide-react |
| Auth | Supabase Auth (email+password, OAuth Google, JWT) |
| База данных | Supabase PostgreSQL + Row Level Security (multi-tenant) |
| ORM | Drizzle ORM (подключён к Supabase Postgres) |
| Биллинг | ЮKassa SDK (подписки 10k/18k/25k ₽/мес) |
| Backend | Flask (существующий, внешний) — Next.js проксирует к нему |
| Telegram-бот | aiogram 3 (Python, отдельный Docker-контейнер) |
| Деплой | Amvera PaaS (`https://job-3-vladis-XXXX.amvera.io`) |
| Пакетный менеджер | npm |

---

## Дизайн-система (перенести из job-2)

```css
/* Тёмная тема */
--bg:        #0B0B0F
--bg-card:   #13131A
--border:    #2A2A3A
--text:      #F9FAFB
--text-2:    #D1D5DB
--text-muted:#6B7280
--primary:   #6366F1
--accent:    #8B5CF6

/* Светлая тема */
--bg:        #F5F5F8
--bg-card:   #FFFFFF
--border:    #E2E2EB
--text:      #111118
--text-muted:#8888A4
```

Переключатель темы: сохранять в `localStorage`, уважать `prefers-color-scheme`.
Класс `.dark` на `<html>` — переключает CSS-переменные.

---

## Структура репозитория

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← sidebar + auth guard
│   │   ├── page.tsx                ← /dashboard (лента тендеров)
│   │   ├── tender/[id]/page.tsx    ← детальная карточка + AI-анализ
│   │   ├── saved/page.tsx          ← сохранённые тендеры
│   │   ├── settings/
│   │   │   ├── page.tsx            ← профиль + Telegram-связка
│   │   │   ├── subscription/page.tsx
│   │   │   └── team/page.tsx
│   │   └── onboarding/page.tsx
│   ├── admin/
│   │   ├── layout.tsx              ← только роль admin
│   │   ├── page.tsx                ← дашборд (MRR, подписки, health)
│   │   ├── tenants/page.tsx
│   │   ├── tenants/[id]/page.tsx
│   │   └── system/page.tsx
│   ├── api/
│   │   ├── tenders/route.ts        ← GET: прокси к Flask + добавить X-Tenant-ID
│   │   ├── tenders/[id]/route.ts
│   │   ├── tenders/[id]/analyze/route.ts ← POST: запуск AI
│   │   ├── tenders/[id]/stream/route.ts  ← GET: SSE поток
│   │   ├── tenders/[id]/decision/route.ts ← PATCH
│   │   ├── tenders/[id]/report/route.ts  ← PDF скачивание
│   │   ├── auth/callback/route.ts
│   │   ├── billing/checkout/route.ts
│   │   ├── billing/webhook/route.ts      ← ЮKassa вебхук
│   │   ├── billing/portal/route.ts
│   │   ├── subscription/status/route.ts
│   │   ├── team/invite/route.ts
│   │   ├── team/[userId]/route.ts
│   │   ├── telegram/connect/route.ts
│   │   ├── telegram/settings/route.ts
│   │   └── admin/stats/route.ts
│   ├── layout.tsx                  ← ThemeProvider, Toaster
│   └── page.tsx                    ← лендинг (публичный)
├── components/
│   ├── ui/                         ← shadcn: button, input, badge, card...
│   ├── TenderCard.tsx
│   ├── TenderDetail.tsx
│   ├── AIAnalysisPanel.tsx         ← SSE-стриминг результатов
│   ├── FiltersBar.tsx
│   ├── SubscriptionGate.tsx        ← blur + lock overlay
│   ├── Sidebar.tsx                 ← desktop sidebar + mobile bottom nav
│   └── ThemeToggle.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               ← createBrowserClient()
│   │   ├── server.ts               ← createServerClient()
│   │   └── middleware.ts           ← updateSession()
│   ├── permissions.ts              ← canUseFeature(plan, feature)
│   ├── yukassa.ts                  ← ЮKassa SDK wrapper
│   └── utils.ts
├── hooks/
│   ├── useTenders.ts
│   ├── useSubscription.ts
│   └── useSSE.ts                   ← EventSource с авто-переподключением
├── types/
│   └── index.ts                    ← Tender, User, Subscription, Plan...
├── bot/                            ← Python aiogram Telegram-бот
│   ├── main.py
│   ├── handlers/
│   │   ├── start.py
│   │   ├── settings.py
│   │   └── alerts.py
│   ├── db.py                       ← asyncpg подключение к Supabase Postgres
│   ├── requirements.txt
│   └── Dockerfile
├── middleware.ts                   ← auth guard для /dashboard/* и /admin/*
├── amvera.yaml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env.local.example
```

---

## База данных (Supabase PostgreSQL)

### Таблицы, которые нужно создать

```sql
-- Тенанты (компании-клиенты)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter', -- starter | team | corporate
  subscription_expires_at TIMESTAMPTZ,
  yukassa_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Связь пользователь ↔ тенант
CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- owner | admin | member
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Telegram пользователи
CREATE TABLE telegram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  telegram_id BIGINT UNIQUE NOT NULL,
  filters JSONB DEFAULT '{}',
  paused_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Сохранённые тендеры (локальные, т.к. тендеры живут в Flask БД)
CREATE TABLE saved_tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tender_id TEXT NOT NULL,  -- ID тендера из Flask backend
  decision TEXT,            -- interesting | rejected | deferred
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, tender_id)
);

-- История платежей
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  yukassa_payment_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,  -- в копейках
  plan TEXT NOT NULL,
  status TEXT NOT NULL,     -- pending | succeeded | canceled
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Row Level Security

```sql
-- Включить RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Пользователь видит только свой тенант
CREATE POLICY "Users see own tenant" ON tenants
  FOR ALL USING (
    id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own tenant_users" ON tenant_users
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users see own saved_tenders" ON saved_tenders
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users see own payments" ON payments
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));
```

### Supabase Trigger — создать тенант при регистрации

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  INSERT INTO public.tenants (name, plan)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'Моя компания'), 'starter')
  RETURNING id INTO new_tenant_id;

  INSERT INTO public.tenant_users (tenant_id, user_id, role)
  VALUES (new_tenant_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## Переменные окружения (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Flask Backend (внутренний, не публичный)
FLASK_BACKEND_URL=http://localhost:5000

# ЮKassa
YUKASSA_SHOP_ID=381764660
YUKASSA_SECRET_KEY=test_xxx
YUKASSA_WEBHOOK_SECRET=сгенерировать-uuid

# Telegram Bot
TELEGRAM_BOT_TOKEN=от-BotFather

# App
NEXT_PUBLIC_APP_URL=https://job-3-vladis-XXXX.amvera.io
NEXTAUTH_SECRET=openssl-rand-base64-32
```

---

## Тарифные планы

| Функция | Старт (10 000 ₽/мес) | Команда (18 000 ₽/мес) | Корпоратив (25 000 ₽/мес) |
|---|---|---|---|
| Пользователей | 1 | до 5 | Unlimited |
| AI-анализов / мес | 30 | 150 | Unlimited |
| Telegram-алерты | Базовые | Расширенные | Приоритетные |
| Экспорт | PDF | PDF + Excel | PDF + Excel + API |
| История решений | 30 дней | 6 месяцев | Unlimited |
| Командная работа | — | ✓ | ✓ |
| API доступ | — | — | ✓ |
| Поддержка | Email 48ч | Email 24ч + чат | Выделенный менеджер |

### Логика доступа (lib/permissions.ts)

```typescript
export type Plan = 'starter' | 'team' | 'corporate';
export type Feature =
  | 'AI_ANALYSIS'        // starter (с лимитом 30/мес)
  | 'TEAM_MANAGEMENT'    // team+
  | 'CRM_INTEGRATION'    // team+
  | 'EXCEL_EXPORT'       // team+
  | 'API_ACCESS'         // corporate
  | 'UNLIMITED_HISTORY'; // corporate

export function canUseFeature(plan: Plan, feature: Feature): boolean {
  const gates: Record<Feature, Plan[]> = {
    AI_ANALYSIS:        ['starter', 'team', 'corporate'],
    TEAM_MANAGEMENT:    ['team', 'corporate'],
    CRM_INTEGRATION:    ['team', 'corporate'],
    EXCEL_EXPORT:       ['team', 'corporate'],
    API_ACCESS:         ['corporate'],
    UNLIMITED_HISTORY:  ['corporate'],
  };
  return gates[feature].includes(plan);
}
```

---

## API контракты (прокси к Flask)

Все запросы к Flask идут через Next.js API Routes.
Next.js добавляет заголовок `X-Tenant-ID` из Supabase JWT.

| Next.js Route | Flask Route | Метод | Описание |
|---|---|---|---|
| `/api/tenders` | `/api/tenders` | GET | Список тендеров с фильтрами |
| `/api/tenders/[id]` | `/api/tender/[id]` | GET | Детальная карточка |
| `/api/tenders/[id]/analyze` | `/api/analyze/[id]` | POST | Запуск AI-анализа |
| `/api/tenders/[id]/stream` | `/api/stream/[id]` | GET | SSE поток AI-анализа |
| `/api/tenders/[id]/decision` | `/api/tender/[id]/decision` | PATCH | Сохранить решение |
| `/api/tenders/[id]/report` | `/api/report/[id]` | GET | PDF-отчёт (stream) |
| `/api/health` | `/api/health` | GET | Статус backend |
| `/api/sync/trigger` | `/api/sync/trigger` | POST | Ручная синхронизация (admin) |

**Пока Flask недоступен** — мокировать в API Routes реалистичными данными.

---

## Ключевые компоненты

### TenderCard (перенести из job-2, расширить)
Добавить к существующим полям:
- `deadline` с красной меткой «Срочно» если < 3 дней
- `is_new` — синяя метка «Новый» если < 24 часов
- `decision` — цветной индикатор (зелёный/красный/жёлтый)
- Быстрые кнопки ✓ / ✗ / ⏸ прямо на карточке (PATCH без перехода, optimistic update)

### AIAnalysisPanel (новый)
```
[ Запустить AI-анализ ] → POST /api/tenders/[id]/analyze
     ↓
Прогресс-бар (SSE поток) → EventSource к /api/tenders/[id]/stream
     ↓
Результат по блокам:
  📋 Суть требований
  🛠 Технический стек
  👥 Требования к команде
  ⚠️ Риски
  🎯 Рекомендация: Участвовать / Не участвовать

[ Скачать PDF-отчёт ]
```

Хук `useSSE(url)` — EventSource с авто-переподключением (max 3 попытки, backoff).

### FiltersBar (новый, состояние в URL)
```
Площадка [MultiSelect] | Сумма от [____] до [____] | Срок [DateRange]
Статус AI [Select] | Решение [Select] | Стек [MultiSelect] | Поиск [____]
```

Состояние фильтров хранить в `searchParams` (`useSearchParams` + `router.replace`).
Дебаунс 300ms для текстового поиска.

### SubscriptionGate (новый)
```tsx
<SubscriptionGate feature="AI_ANALYSIS" plan={userPlan}>
  <AIAnalysisPanel />  // ← blur если нет доступа
</SubscriptionGate>
```
Показывает замок + название фичи + кнопку «Улучшить план».

---

## Поток оплаты (ЮKassa)

```
1. Пользователь выбирает план на /pricing или /settings/subscription
2. POST /api/billing/checkout { plan: 'team', period: 'monthly' }
3. API Route создаёт платёж в ЮKassa → возвращает { payment_url }
4. Редирект на страницу ЮKassa
5. Успешная оплата → ЮKassa вызывает POST /api/billing/webhook
6. Webhook проверяет подпись → обновляет tenants.plan + subscription_expires_at
7. Редирект на /settings/subscription?success=true
```

Тестовый режим: карта 4111 1111 1111 1111, любой CVV, любая дата.

---

## Telegram-бот (bot/)

### Команды
| Команда | Поведение |
|---|---|
| `/start` | Приветствие + инструкция подключения |
| `/connect <code>` | Привязать к аккаунту по коду из веб-интерфейса |
| `/settings` | Inline-кнопки: фильтры, включить/выключить |
| `/pause 24h\|7d\|forever` | Приостановить уведомления |
| `/resume` | Возобновить |
| `/status` | Текущие настройки |

### Формат алерта
```
🔔 Новый ИТ-тендер

Название: [title]
Заказчик: [zakazchik]
Сумма: X ₽
Срок подачи: DD.MM.YYYY (осталось N дней)
Площадка: ЕИС

[📋 Открыть тендер]  [✓ Участвуем]  [✗ Не участвуем]
```

### Архитектура бота
- Python 3.12 + aiogram 3 + asyncpg
- Polling каждые 5 минут (не webhook, для упрощения)
- Читает из `telegram_users` + обращается к Flask API за новыми тендерами
- Deep link подключения: `https://t.me/[bot]?start=connect_[uuid_code]`

---

## Admin-панель (/admin)

### Страницы
| Маршрут | Содержимое |
|---|---|
| `/admin` | MRR, активные подписки, новые за 7 дней, health check Flask+Celery |
| `/admin/tenants` | Таблица клиентов: компания, план, оплата, статус, кнопка деактивации |
| `/admin/tenants/[id]` | Пользователи тенанта, платежи, лог активности |
| `/admin/subscriptions` | Управление тарифами |
| `/admin/system` | Статус Celery, Redis, последняя синхронизация |

Доступ: только пользователи с `role = 'admin'` в `tenant_users`.
Middleware перенаправляет остальных на `/dashboard`.

---

## middleware.ts

```typescript
// Защита маршрутов
// /dashboard/* и /admin/* → редирект на /login без сессии
// /admin/* → редирект на /dashboard если роль != 'admin'
// Публичные: /, /login, /register, /pricing, /api/billing/webhook

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|_next/font).*)'],
};
```

---

## amvera.yaml

```yaml
meta:
  environment: nodejs
  toolchain:
    name: npm
    version: "20"
build:
  additionalCommands: npm run build
  artifacts:
    "*": /
run:
  scriptName: node_modules/.bin/next
  args: start
  containerPort: 3000
  persistenceMount: /data
```

> Если Amvera не поддерживает `args` — создать `start.js`:
> ```js
> import { createServer } from 'http';
> import next from 'next';
> const app = next({ dev: false });
> await app.prepare();
> // ...
> ```

---

## Порядок реализации (фазы)

### Фаза 0 — Инфраструктура (первая сессия)
- [ ] `npx create-next-app@latest` с флагами `--typescript --tailwind --app`
- [ ] Установить зависимости: `@supabase/supabase-js @supabase/ssr @supabase/auth-helpers-nextjs`
- [ ] Установить UI: `shadcn/ui`, `lucide-react`, `sonner`
- [ ] Установить утилиты: `zod`, `date-fns`, `numeral`
- [ ] Создать структуру папок согласно схеме выше
- [ ] Перенести CSS-переменные тем из job-2 (`index.css`)
- [ ] Создать `ThemeProvider` + `ThemeToggle`
- [ ] Создать `.env.local.example`
- [ ] Настроить `amvera.yaml`
- [ ] Создать SQL-миграции в Supabase (таблицы + RLS + trigger)
- [ ] Создать `lib/supabase/client.ts`, `server.ts`, `middleware.ts`
- [ ] Создать `middleware.ts` с защитой маршрутов

### Фаза 1 — Аутентификация
- [ ] Страница `/login` (email+password + Google OAuth)
- [ ] Страница `/register` (+ company_name, phone)
- [ ] Страница `/reset-password`
- [ ] Онбординг `/onboarding` (настройка фильтров после регистрации)
- [ ] `lib/permissions.ts`

### Фаза 2 — Лента тендеров (мок → реальный API)
- [ ] Layout dashboard с Sidebar (перенести из job-2, адаптировать)
- [ ] `/dashboard` — лента с фильтрами
- [ ] `TenderCard` (расширить из job-2)
- [ ] `FiltersBar` (состояние в URL)
- [ ] `SubscriptionGate`
- [ ] API Route: GET `/api/tenders` → прокси к Flask (или мок)
- [ ] PATCH `/api/tenders/[id]/decision` — быстрые решения

### Фаза 3 — Детальная карточка и AI-анализ
- [ ] `/dashboard/tender/[id]` — полная карточка
- [ ] `AIAnalysisPanel` с SSE-стримингом
- [ ] `useSSE` hook с авто-переподключением
- [ ] PDF-скачивание
- [ ] `/dashboard/saved` — сохранённые

### Фаза 4 — Биллинг
- [ ] `/pricing` — публичная страница тарифов
- [ ] `/dashboard/settings/subscription` — управление подпиской
- [ ] API Routes: checkout, webhook, portal, status
- [ ] ЮKassa интеграция
- [ ] Обновление `plan` после webhook
- [ ] `SubscriptionGate` интеграция по всему приложению

### Фаза 5 — Командная работа и настройки
- [ ] `/dashboard/settings` — профиль
- [ ] `/dashboard/settings/team` — управление командой
- [ ] Telegram-связка (генерация кода, deep link)
- [ ] API Routes: `/api/team/*`, `/api/telegram/*`

### Фаза 6 — Admin-панель
- [ ] `/admin` layout с role-check
- [ ] Все admin-страницы
- [ ] `/api/admin/stats`

### Фаза 7 — Telegram-бот
- [ ] `bot/` структура с aiogram 3
- [ ] Все команды и алерты
- [ ] Docker-контейнер
- [ ] Интеграция с Supabase Postgres через asyncpg

### Фаза 8 — Лендинг и SEO
- [ ] `/` — публичный лендинг (SSR для SEO)
- [ ] `/pricing` — детальное сравнение тарифов
- [ ] meta-теги, og:image

---

## Что взять из job-2 (repo: vladilslavandrosov-prog/job-2)

| Файл из job-2 | Что взять | Что изменить |
|---|---|---|
| `client/src/index.css` | CSS-переменные тем, scrollbar, safe-bottom | Без изменений |
| `client/src/lib/theme.tsx` | ThemeProvider, useTheme | Без изменений |
| `client/src/components/TenderCard.tsx` | Вся разметка + стили | Добавить: decision, is_new, срочно, кнопки ✓✗⏸ |
| `client/src/components/TenderDetail.tsx` | Вся разметка + стили | Добавить: AIAnalysisPanel, PDF-кнопка |
| `client/src/components/Sidebar.tsx` | Навигация + bottom nav + ThemeToggle | Обновить ссылки под Next.js (`Link` из next/link) |
| `client/src/pages/BillingPage.tsx` | Карточки планов | Обновить цены (10k/18k/25k), добавить ЮKassa checkout |
| `client/src/pages/AuthPage.tsx` | Разметка форм | Переключить на Supabase auth методы |
| `client/src/lib/utils.ts` | `cn()`, форматтеры | Без изменений |
| `client/src/components/ui/*` | Все UI-компоненты | Без изменений |

---

## Важные технические детали

### Supabase SSR в Next.js App Router
```typescript
// lib/supabase/server.ts — для Server Components и API Routes
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: ... } }
  );
}
```

### Получение tenant_id в API Routes
```typescript
// В каждом API Route, который проксирует к Flask:
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
const { data: tenantUser } = await supabase
  .from('tenant_users')
  .select('tenant_id')
  .eq('user_id', user.id)
  .single();

// Добавляем к запросу во Flask:
fetch(`${process.env.FLASK_BACKEND_URL}/api/tenders`, {
  headers: { 'X-Tenant-ID': tenantUser.tenant_id }
});
```

### SSE в Next.js App Router
```typescript
// app/api/tenders/[id]/stream/route.ts
export async function GET(req: Request, { params }) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const flaskStream = await fetch(
        `${process.env.FLASK_BACKEND_URL}/api/stream/${params.id}`
      );
      const reader = flaskStream.body!.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value);
      }
      controller.close();
    }
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
  });
}
```

### useSSE hook
```typescript
export function useSSE(url: string | null) {
  const [data, setData] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle'|'connecting'|'streaming'|'done'|'error'>('idle');

  useEffect(() => {
    if (!url) return;
    let attempts = 0;
    let es: EventSource;

    function connect() {
      es = new EventSource(url);
      setStatus('connecting');
      es.onmessage = (e) => { setData(prev => [...prev, e.data]); setStatus('streaming'); };
      es.onerror = () => {
        es.close();
        if (attempts < 3) { attempts++; setTimeout(connect, 1000 * attempts); }
        else setStatus('error');
      };
      es.addEventListener('done', () => { es.close(); setStatus('done'); });
    }
    connect();
    return () => es?.close();
  }, [url]);

  return { data, status };
}
```

---

## Первая команда в новой сессии

```
Создай Next.js 14 проект TenderIntel в репозитории vladilslavandrosov-prog/job-3.
Используй этот промт как полную спецификацию.
Начни с Фазы 0: инициализация проекта, структура папок, Tailwind,
CSS-переменные тем (перенести из job-2), ThemeProvider, Supabase клиенты,
middleware.ts с защитой маршрутов, amvera.yaml.
Сделай коммит и пуш каждой законченной части.
```
