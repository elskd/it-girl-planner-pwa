# It Girl Planner

Персональный адаптивный PWA-каркас на React, TypeScript и Vite. Включает главную, разделы целей и планирования, профиль Maddy, настройки темы и публикацию в GitHub Pages. Данные, аккаунты, цели, задачи и прогресс пока не реализованы.

## Разработка

```sh
npm install
npm run dev
```

## Проверки и сборка

```sh
npm test
npm run build
npm run preview
```

## Публикация

Workflow `.github/workflows/deploy.yml` собирает проект при push в `main` и загружает `dist` в GitHub Pages. В репозитории открой **Settings → Pages → Build and deployment → Source → GitHub Actions**. Маршруты используют `HashRouter`, а Vite собирает ресурсы с относительным base path, поэтому имя репозитория задавать не требуется.

Рабочая ссылка появится в разделе **Settings → Pages** после публикации. Локальный git-репозиторий создан на ветке `main`; GitHub remote ещё не подключён, потому что для входа в аккаунт требуется действие владельца. После создания нового публичного репозитория нужно отправить ветку `main`, а затем один раз выбрать GitHub Actions в настройках Pages.

## Структура

- `src/App.tsx` — маршруты и состав страниц первого этапа.
- `src/pages/` — независимые страницы Dashboard, Goals, Planner, Maddy, Settings и 404.
- `src/components/` — общие UI-компоненты, шапка и навигация.
- `src/styles.css` — дизайн-токены Dark/Light Feminine, адаптивная сетка и состояния интерфейса.
- `src/test/` — окружение Vitest.
- `public/icons/` — PWA-иконки.
- `vite.config.ts` — Vite, PWA manifest, относительный путь и Vitest.

Следующие области можно вынести в независимые feature-модули: `goals`, `planner`, `maddy`, `dashboard`, `settings`, `auth`, `data`. Для Supabase не созданы фиктивные клиенты и ключи; подключение можно добавить в `src/lib/data/` на отдельном этапе.
