import { db } from "./db.js";
import { users, tenders } from "../shared/schema.js";
import bcrypt from "bcryptjs";

const demoUser = {
  username: "demo",
  email: "demo@tenderai.ru",
  password: await bcrypt.hash("demo123", 10),
  plan: "pro",
};

const sampleTenders = [
  {
    title: "Разработка системы управления тендерами для государственных закупок",
    description: "Требуется разработать веб-систему для автоматизации процесса государственных закупок с интеграцией с ЕИС. Система должна поддерживать электронный документооборот, автоматическую проверку заявок.",
    customer: "Министерство финансов РФ",
    budget: "15 000 000 ₽",
    deadline: new Date("2024-09-30"),
    category: "development",
    platform: "zakupki.gov.ru",
    url: "https://zakupki.gov.ru/tender/123456",
    status: "active",
    aiScore: 92,
  },
  {
    title: "Создание корпоративного портала на базе SharePoint",
    description: "Внедрение и настройка корпоративного портала на базе Microsoft SharePoint для холдинговой компании.",
    customer: "ПАО Газпром",
    budget: "8 500 000 ₽",
    deadline: new Date("2024-08-15"),
    category: "development",
    platform: "sberbank-ast.ru",
    url: "https://sberbank-ast.ru/tender/78901",
    status: "active",
    aiScore: 87,
  },
  {
    title: "Поставка и настройка серверного оборудования",
    description: "Поставка серверов HPE ProLiant, систем хранения данных и сетевого оборудования Cisco для модернизации дата-центра.",
    customer: "ФНС России",
    budget: "25 000 000 ₽",
    deadline: new Date("2024-07-31"),
    category: "hardware",
    platform: "roseltorg.ru",
    url: "https://roseltorg.ru/tender/45678",
    status: "active",
    aiScore: 78,
  },
  {
    title: "Разработка мобильного приложения для HR-процессов",
    description: "Создание кроссплатформенного мобильного приложения для iOS и Android для автоматизации HR-процессов.",
    customer: "ВТБ Банк",
    budget: "5 200 000 ₽",
    deadline: new Date("2024-10-01"),
    category: "mobile",
    platform: "tender.vtb.ru",
    url: "https://tender.vtb.ru/mobile/1234",
    status: "active",
    aiScore: 95,
  },
  {
    title: "Техническое обслуживание ИТ-инфраструктуры",
    description: "Оказание услуг технического обслуживания и поддержки серверного и сетевого оборудования на объектах заказчика по всей России.",
    customer: "РЖД",
    budget: "12 000 000 ₽",
    deadline: new Date("2024-11-30"),
    category: "support",
    platform: "zakupki.gov.ru",
    url: "https://zakupki.gov.ru/tender/789012",
    status: "active",
    aiScore: 82,
  },
  {
    title: "Внедрение комплексной системы информационной безопасности",
    description: "Поставка, установка и настройка SIEM, DLP, антивирусной защиты и системы управления уязвимостями.",
    customer: "Сбербанк",
    budget: "18 700 000 ₽",
    deadline: new Date("2024-09-15"),
    category: "security",
    platform: "sberbank-ast.ru",
    url: "https://sberbank-ast.ru/security/56789",
    status: "active",
    aiScore: 89,
  },
  {
    title: "Разработка AI-платформы для анализа финансовых данных",
    description: "Создание платформы на базе машинного обучения для анализа и прогнозирования финансовых данных.",
    customer: "Альфа-Банк",
    budget: "22 000 000 ₽",
    deadline: new Date("2024-12-01"),
    category: "ai",
    platform: "zakupki.gov.ru",
    url: "https://zakupki.gov.ru/ai/901234",
    status: "active",
    aiScore: 97,
  },
  {
    title: "Интеграция 1С с системами ЭДО и банковского обслуживания",
    description: "Разработка интеграционных решений для связи 1С:Предприятие 8.3 с системами ЭДО и банк-клиентами.",
    customer: "Ростелеком",
    budget: "3 800 000 ₽",
    deadline: new Date("2024-08-30"),
    category: "integration",
    platform: "roseltorg.ru",
    url: "https://roseltorg.ru/erp/234567",
    status: "active",
    aiScore: 74,
  },
];

async function seed() {
  console.log("Seeding database...");

  // Demo user
  const existing = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.username, "demo") });
  if (!existing) {
    await db.insert(users).values(demoUser);
    console.log("Created demo user: login=demo, password=demo123");
  } else {
    console.log("Demo user already exists");
  }

  // Tenders
  for (const tender of sampleTenders) {
    await db.insert(tenders).values(tender).onConflictDoNothing();
  }
  console.log(`Seeded ${sampleTenders.length} tenders`);

  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
