# Marketing RPG Team — Architecture

> **Claude Code: ВСЕГДА читай этот файл первым перед любыми изменениями.**

## Что это за проект

RPG-стилизованный веб-интерфейс с пиксель-арт визуалом (LimeZu спрайты).
Пользователь заходит → видит офис с персонажами-маркетологами → кликает на персонажа → даёт задание.
За кулисами каждый персонаж — специализированный AI-агент (Claude, Gemini, Perplexity).
Результаты можно отправить в рабочие инструменты через Make.com webhooks.

## Технологический стек

| Компонент | Технология |
|-----------|------------|
| Фронтенд | React 18 + Phaser 3 (пиксель-арт сцена) |
| Бэкенд | Next.js 14 API Routes |
| AI-движок | Claude API (основной), Gemini API, Perplexity API |
| База данных | Supabase (PostgreSQL + Auth) |
| Автоматизация | Make.com (webhooks) |
| Хостинг | Vercel |
| Спрайты | LimeZu asset pack (в /public/sprites/) |

## Структура проекта

```
marketing-rpg/
├── ARCHITECTURE.md          ← ТЫ ЗДЕСЬ
├── CLAUDE_CODE_PROMPT.md    ← инструкция для первой сборки
├── package.json
├── next.config.js
├── .env.local.example       ← шаблон переменных окружения
│
├── /characters/             ← JSON-конфиги персонажей
│   ├── seo-analyst.json
│   ├── creative-director.json
│   ├── senior-copywriter.json
│   └── ua-strategist.json
│
├── /tasks/                  ← JSON-конфиги задач
│   ├── seo-keywords.json
│   ├── seo-audit.json
│   ├── creative-brief.json
│   ├── creative-scoring.json
│   ├── text-write.json
│   ├── text-edit.json
│   ├── ua-hypothesis.json
│   └── ua-benchmark.json
│
├── /rooms/                  ← JSON-конфиги комнат (layout)
│   └── main-office.json
│
├── /webhooks/               ← маппинг персонаж → Make.com webhook
│   └── make-scenarios.json
│
├── /public/
│   └── /sprites/            ← LimeZu спрайты
│
├── /src/
│   ├── /app/                ← Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx         ← главная страница (RPG сцена)
│   │   ├── /login/
│   │   │   └── page.tsx
│   │   └── /api/
│   │       ├── /chat/
│   │       │   └── route.ts ← POST: отправка задачи AI-агенту
│   │       ├── /webhook/
│   │       │   └── route.ts ← POST: отправка результата в Make.com
│   │       └── /usage/
│   │           └── route.ts ← GET: статистика расходов
│   │
│   ├── /components/
│   │   ├── RPGScene.tsx     ← Phaser canvas с комнатой и персонажами
│   │   ├── ChatPanel.tsx    ← панель чата с персонажем
│   │   ├── TaskSelector.tsx ← выбор задачи для персонажа
│   │   └── UsageDashboard.tsx
│   │
│   ├── /lib/
│   │   ├── ai-router.ts    ← роутинг запросов к нужной AI-модели
│   │   ├── characters.ts   ← загрузка JSON-конфигов персонажей
│   │   ├── tasks.ts        ← загрузка JSON-конфигов задач
│   │   ├── rooms.ts        ← загрузка JSON-конфигов комнат
│   │   ├── webhooks.ts     ← отправка в Make.com
│   │   ├── supabase.ts     ← клиент Supabase
│   │   └── usage.ts        ← трекинг расходов
│   │
│   └── /types/
│       └── index.ts         ← TypeScript типы
│
└── /docs/
    └── SETUP.md             ← инструкция по настройке сервисов
```

## Ключевые конвенции

### Персонажи (characters/*.json)

Каждый персонаж — отдельный JSON-файл. Система автоматически подхватывает все файлы из /characters/.

```json
{
  "id": "seo-analyst",
  "name": "SEO Analyst",
  "name_ru": "SEO-аналитик",
  "role": "Ключевые слова, мета-описания, аудит",
  "sprite_id": "character_01",
  "room": "main-office",
  "position": { "x": 3, "y": 2 },
  "tasks": ["seo-keywords", "seo-audit"],
  "system_prompt": "...",
  "default_model": "claude-sonnet",
  "available_models": ["claude-sonnet", "perplexity"],
  "webhook_on_complete": "seo-results"
}
```

**Обязательные поля:** id, name, name_ru, role, sprite_id, room, position, tasks, system_prompt, default_model

**Добавить нового персонажа:**
1. Создай файл в /characters/ (используй существующий как шаблон)
2. Добавь задачи в /tasks/ если нужны новые
3. Обнови /rooms/*.json — добавь позицию на карте
4. Готово. Перезагрузка не нужна (hot reload).

### Задачи (tasks/*.json)

```json
{
  "id": "seo-keywords",
  "name": "Кластеризация ключевых слов",
  "description": "Группировка ключевых слов по кластерам",
  "model_override": null,
  "prompt_template": "Проанализируй следующие ключевые слова и сгруппируй их в семантические кластеры:\n\n{{user_input}}",
  "output_format": "structured",
  "webhook_action": "seo-results"
}
```

**model_override:** если null — используется default_model персонажа. Если указана модель — она приоритетнее.

### Комнаты (rooms/*.json)

```json
{
  "id": "main-office",
  "name": "Главный офис",
  "tilemap": "office_tilemap",
  "size": { "width": 10, "height": 8 },
  "characters": ["seo-analyst", "creative-director", "senior-copywriter", "ua-strategist"]
}
```

### AI Router (src/lib/ai-router.ts)

Центральный роутер запросов. Определяет какую модель вызвать на основе:
1. task.model_override (приоритет)
2. character.default_model (фоллбэк)

Поддерживаемые модели:
- `claude-sonnet` → Anthropic API, модель claude-sonnet-4-5-20250929
- `claude-opus` → Anthropic API, модель claude-opus-4-6
- `gemini-pro` → Google AI API, модель gemini-2.5-pro
- `perplexity` → Perplexity API, модель sonar-pro

### Webhooks (webhooks/make-scenarios.json)

```json
{
  "seo-results": {
    "url": "https://hook.make.com/xxx",
    "description": "SEO результаты → Google Sheets"
  },
  "creative-brief": {
    "url": "https://hook.make.com/yyy",
    "description": "Бриф → Asana задача"
  }
}
```

URL заполняется после настройки сценариев в Make.com.

## Правила для Claude Code

1. **Максимальный размер файла: 200 строк.** Если файл растёт — разбивай.
2. **Один файл = одна ответственность.** Не мешай логику персонажей с логикой чата.
3. **Не трогай чужие конфиги.** Если задача — добавить персонажа, не меняй существующих.
4. **Запускай тесты перед завершением:** `npm run validate` проверяет все JSON-конфиги.
5. **Коммить после каждого логического изменения** с описательным сообщением.
6. **Переменные окружения** — никогда не хардкодь API-ключи. Используй process.env.

## Переменные окружения (.env.local)

```
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx-...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Ограничения и расходы

- Дневной лимит на пользователя: 30 запросов (настраивается в .env)
- Месячный лимит: устанавливается в Anthropic Console
- Sonnet используется для 80% задач, Opus — только если явно указан в task.model_override
- Логирование расходов: каждый запрос записывается в Supabase (модель, токены, пользователь, timestamp)
