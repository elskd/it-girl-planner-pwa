# It Girl Planner

Персональное адаптивное PWA на React, TypeScript и Vite. Подключена клиентская часть Supabase Auth: регистрация по почте и паролю, вход, выход, восстановление пароля и закрытый доступ к приложению. Цели, задачи и прогресс появятся в следующих этапах.

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

Workflow `.github/workflows/deploy.yml` собирает проект при push в `main` и загружает `dist` в GitHub Pages. В **Settings → Secrets and variables → Actions → Variables** добавь `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY` для сборки опубликованного приложения.

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
