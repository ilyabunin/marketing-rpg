# Промпт-инструкция для Claude Code

> **Скопируй этот текст и вставь в Claude Code для сборки MVP.**
> **Перед запуском убедись что у тебя есть: API-ключи (Anthropic, Google AI, Perplexity), Supabase проект, LimeZu спрайты.**

---

## Инструкция для Claude Code:

Прочитай файл ARCHITECTURE.md в корне проекта. Это главный документ — следуй его структуре и конвенциям.

Построй MVP веб-приложения "Marketing RPG Team" со следующими требованиями:

### 1. Инициализация проекта
- Создай Next.js 14 проект с App Router и TypeScript
- Установи зависимости: phaser, @supabase/supabase-js, @anthropic-ai/sdk
- Скопируй существующие файлы из /characters/, /tasks/, /rooms/, /webhooks/ в проект
- Создай .env.local из .env.local.example

### 2. База данных (Supabase)
- Создай SQL-миграцию для таблиц:
  - `users` (id, email, name, created_at) — будет управляться Supabase Auth
  - `chat_history` (id, user_id, character_id, task_id, user_message, ai_response, model_used, tokens_input, tokens_output, cost_estimate, created_at)
  - `usage_daily` (id, user_id, date, request_count, total_cost)

### 3. Аутентификация
- Supabase Auth с email + password
- Страница /login с формой входа
- Middleware для защиты всех страниц кроме /login
- Простая регистрация (пока без подтверждения email для удобства тестирования)

### 4. RPG-интерфейс (главная страница)
- React-компонент с Phaser 3 canvas
- Загрузи комнату из /rooms/main-office.json
- Отрисуй персонажей на их позициях (используй спрайты из /public/sprites/)
- При клике на персонажа — открой ChatPanel справа
- Если спрайты LimeZu ещё не подключены — используй цветные placeholder-квадраты с именами (потом заменим)

### 5. ChatPanel (панель чата)
- Показывает имя и роль персонажа
- Greeting-сообщение при открытии (из character.greeting)
- TaskSelector — дропдаун с доступными задачами персонажа
- Поле ввода сообщения
- Кнопка "Отправить"
- Отображение ответа AI (с поддержкой markdown)
- Кнопка "Отправить в Make.com" после получения ответа (вызывает webhook)
- Индикатор загрузки во время запроса

### 6. AI Router (src/lib/ai-router.ts)
- Функция routeRequest(characterId, taskId, userInput, userId)
- Загружает character.json и task.json
- Определяет модель: task.model_override || character.default_model
- Формирует промпт: character.system_prompt + task.prompt_template (заменяя {{user_input}})
- Вызывает соответствующий API:
  - claude-sonnet → Anthropic SDK, model: "claude-sonnet-4-5-20250929"
  - claude-opus → Anthropic SDK, model: "claude-opus-4-6"
  - gemini-pro → Google AI REST API, model: "gemini-2.5-pro"
  - perplexity → Perplexity REST API, model: "sonar-pro"
- Возвращает: { response, model, tokens_input, tokens_output, cost_estimate }
- Логирует в Supabase chat_history

### 7. Webhook отправка (src/lib/webhooks.ts)
- Загружает URL из /webhooks/make-scenarios.json
- POST запрос с JSON: { character, task, user, result, timestamp }
- Если URL пустой — показать пользователю "Webhook не настроен"

### 8. Usage tracking (src/lib/usage.ts)
- При каждом запросе: инкремент usage_daily
- Проверка дневного лимита (process.env.DAILY_REQUEST_LIMIT)
- Если лимит превышен — вернуть ошибку "Дневной лимит запросов исчерпан"

### 9. API Routes
- POST /api/chat — принимает { characterId, taskId, message, userId }, вызывает AI Router
- POST /api/webhook — принимает { characterId, taskId, result }, отправляет в Make.com
- GET /api/usage — возвращает статистику расходов пользователя

### 10. Стили
- Минимальный CSS: тёмная тема (под RPG-атмосферу)
- Phaser canvas слева (70%), ChatPanel справа (30%)
- Мобильная версия: ChatPanel на весь экран при выборе персонажа

### Порядок сборки
1. Сначала: Next.js scaffold + .env + базовый layout
2. Затем: Supabase auth + login page
3. Затем: AI Router (начни с Claude Sonnet, добавь остальные)
4. Затем: ChatPanel + TaskSelector (без Phaser — просто список персонажей)
5. Затем: Phaser RPG-сцена (заменяет список)
6. Затем: Webhooks + Usage tracking
7. В конце: запусти npm run validate и проверь что всё работает

### Важно
- Следуй структуре из ARCHITECTURE.md
- Ни один файл не должен быть больше 200 строк
- Не хардкодь API-ключи — только process.env
- Коммить после каждого шага с описательным сообщением
