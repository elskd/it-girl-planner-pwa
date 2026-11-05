# It Girl Planner

Персональное адаптивное PWA на React, TypeScript и Vite. Подключена Supabase Auth: регистрация, вход, выход и восстановление пароля. Цели и Key Results сохраняются в Supabase. Планировщик поддерживает календарь месяца и недели, создание, редактирование, перенос и выполнение задач, а также связь задачи с целью.

## Разработка

```sh
npm install
npm run dev
```

Создай `.env.local` по образцу `.env.example`, указав URL проекта Supabase и его **publishable key**, затем запусти `npm run dev`.

Не помещай в приложение `service_role` или secret API key. Publishable key предназначен для браузера; доступ к строкам базы данных должен защищаться RLS.

## Проверки и сборка

```sh
npm test
npm run build
npm run preview
```

## Публикация

Workflow `.github/workflows/deploy.yml` собирает проект при push в `main` и загружает `dist` в GitHub Pages. Production URL и publishable key хранятся в `.env.production`; publishable key предназначен для клиентской части и не является секретом. Локальные настройки разработки задаются в `.env.local`.

В Supabase Auth → URL Configuration укажи **Site URL** `https://elskd.github.io/it-girl-planner-pwa/` и добавь в **Redirect URLs** `https://elskd.github.io/it-girl-planner-pwa/**`, `http://localhost:5173/**` и `http://127.0.0.1:5173/**`. Публичный репозиторий: https://github.com/elskd/it-girl-planner-pwa. Приложение: https://elskd.github.io/it-girl-planner-pwa/ .

## Структура

- `src/App.tsx` — маршруты и состав страниц первого этапа.
- `src/pages/AuthPage.tsx` — регистрация, вход, сброс и смена пароля.
- `src/lib/auth/AuthContext.tsx` — состояние сессии и выход из аккаунта.
- `src/lib/supabase/client.ts` — браузерный клиент Supabase с PKCE.
- `supabase/migrations/` — миграции и политики доступа для таблиц.
- `src/pages/` — независимые страницы Dashboard, Goals, Planner, Maddy, Settings и 404.
- `src/components/` — общие UI-компоненты, шапка и навигация.
- `src/styles.css` — дизайн-токены Dark/Light Feminine, адаптивная сетка и состояния интерфейса.
- `src/test/` — окружение Vitest.
- `public/icons/` — PWA-иконки.
- `vite.config.ts` — Vite, PWA manifest, относительный путь и Vitest.

Следующие области можно вынести в независимые feature-модули: `goals`, `planner`, `maddy`, `dashboard`, `settings`, `auth`, `data`.
