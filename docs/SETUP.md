# Пошаговая настройка сервисов

## Порядок действий

Выполняй по порядку. Каждый шаг — 5-10 минут.

---

## 1. GitHub

1. Иди на https://github.com → Sign up
2. Подтверди email
3. Создай репозиторий: кнопка "+" → "New repository"
   - Имя: `marketing-rpg`
   - Тип: Private
   - Инициализация: с README
4. Сохрани ссылку на репозиторий

---

## 2. Anthropic Console (Claude API)

1. Иди на https://console.anthropic.com → Sign up
2. Подтверди email
3. Settings → Billing → Add payment method → пополни $10
4. Settings → Billing → Set monthly limit → $30 (защита от перерасхода)
5. Settings → API Keys → Create Key
   - Имя: "marketing-rpg"
   - Скопируй ключ (начинается с sk-ant-...)
   - ⚠️ Ключ показывается ОДИН раз — сохрани в надёжном месте

---

## 3. Google AI Studio (Gemini API)

1. Иди на https://aistudio.google.com
2. Войди через Google-аккаунт
3. Слева: "Get API key" → "Create API key"
   - Выбери проект или создай новый
   - Скопируй ключ (начинается с AIza...)
4. Бесплатный тариф: 15 запросов/мин, 1M токенов/день — хватит на старт

---

## 4. Perplexity API

1. Иди на https://docs.perplexity.ai
2. Sign up → подтверди email
3. API Keys → Generate → скопируй ключ (начинается с pplx-...)
4. Billing → добавь карту → пополни $5
5. Модель для наших задач: sonar-pro

---

## 5. Supabase

1. Иди на https://supabase.com → Start your project
2. Войди через GitHub (удобнее)
3. New Project:
   - Organization: создай или выбери
   - Name: marketing-rpg
   - Database password: придумай и СОХРАНИ
   - Region: EU West (ближе к тебе)
4. Дождись создания (~2 мин)
5. Settings → API → скопируй:
   - Project URL (это NEXT_PUBLIC_SUPABASE_URL)
   - anon public key (это NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - service_role key (это SUPABASE_SERVICE_ROLE_KEY) ⚠️ секретный

---

## 6. Vercel

1. Иди на https://vercel.com → Sign up with GitHub
2. Авторизуй доступ к GitHub
3. "Import Project" → выбери репозиторий `marketing-rpg`
4. Environment Variables → добавь все ключи из .env.local:
   - ANTHROPIC_API_KEY
   - GOOGLE_AI_API_KEY
   - PERPLEXITY_API_KEY
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - DAILY_REQUEST_LIMIT = 30
   - DEFAULT_MODEL = claude-sonnet
5. Deploy → готово!
6. Твой сайт будет на: marketing-rpg.vercel.app

---

## 7. Make.com (позже, после MVP)

1. Иди на https://make.com → Sign up
2. Бесплатный план: 1,000 операций/мес
3. Создай сценарии:
   - Для каждого webhook из webhooks/make-scenarios.json
   - Начни с: New Scenario → Webhook (Custom webhook) → скопируй URL
   - Добавь модуль назначения (Google Sheets, Asana, etc.)
4. Вставь URL в webhooks/make-scenarios.json

---

## Чеклист после регистрации

- [ ] GitHub аккаунт + репозиторий marketing-rpg
- [ ] Anthropic API ключ (sk-ant-...)
- [ ] Google AI API ключ (AIza...)
- [ ] Perplexity API ключ (pplx-...)
- [ ] Supabase проект + 3 ключа (URL, anon, service_role)
- [ ] Vercel аккаунт (связан с GitHub)
- [ ] Все ключи сохранены в надёжном месте

**После чеклиста → открывай Claude Code, вставляй инструкцию из CLAUDE_CODE_PROMPT.md**
