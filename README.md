# Letters Evolution Stages API

Лабораторные 3 и 4: REST API + SSR для сервиса «Этапы эволюции письма».
Тема: определение времени создания рукописи по палеографическим признакам
(начертание «ять», твёрдый знак «ъ», «фита» и др.).

## Стек

- **NestJS** + TypeScript
- **TypeORM** + PostgreSQL (порт 5433)
- **MinIO** — S3-хранилище для изображений и видео (порт 9000, консоль 9001)
- **Redis** — хранение сессий (порт 6379)
- **Handlebars** — SSR-шаблоны
- **Swagger** — документация API (`/api/docs`)
- **Docker Compose** — postgres, adminer, minio, redis

## Запуск

```bash
docker-compose up -d
npm install
npm run start:dev
```

Приложение: http://localhost:3000
Swagger:     http://localhost:3000/api/docs
Adminer:     http://localhost:8081 (Server: postgres, User: myuser, Pass: mypassword, DB: stages_db)
MinIO:       http://localhost:9001 (root / rootpassword)

---

## Таблицы БД

### `letters_evolution_stages` — услуги (этапы эволюции письма)

| Поле | Тип | Описание |
|---|---|---|
| id | SERIAL, PK | Идентификатор |
| title | VARCHAR(200) | Название этапа |
| description | TEXT | Подробное описание |
| status | VARCHAR(20) | draft / published / deleted |
| imageUrl | VARCHAR(200) | Имя файла изображения в MinIO |
| videoUrl | VARCHAR(200) | Имя файла видео в MinIO |
| century | INTEGER | Век (поле по теме 1) |
| sign | VARCHAR(50) | Признак (поле по теме 2, «Ять») |
| createdAt | TIMESTAMP | Дата создания |
| updatedAt | TIMESTAMP | Дата последнего обновления |
| creatorId | INTEGER, FK | → letters_evolution_stages_users.id |

### `letters_evolution_stages_users` — пользователи

| Поле | Тип | Описание |
|---|---|---|
| id | SERIAL, PK | Идентификатор |
| email | VARCHAR(100), UNIQUE | Email |
| username | VARCHAR(100) | Имя |
| password | VARCHAR(200) | Пароль |
| role | VARCHAR(20) | user / moderator |

### `letters_evolution_stages_likes` — лайки (м-м users ↔ stages)

| Поле | Тип | Описание |
|---|---|---|
| id | SERIAL, PK | Идентификатор |
| userId | INTEGER, FK | → letters_evolution_stages_users.id |
| stageId | INTEGER, FK | → letters_evolution_stages.id |
| — | UNIQUE(userId, stageId) | Один пользователь — один лайк на услугу |

---

## HTTP-методы

### Домен «Услуги»

| № | Метод | URL | Описание | Вход | Выход |
|---|---|---|---|---|---|
| 1 | GET | `/api/stages` | Список опубликованных услуг с фильтром по веку | `?century=14` (опц.) | массив услуг с `isMine`, `isLiked`, `likesCount` |
| 2 | GET | `/api/feed` | Лента: одна карточка | `?id=2`, `?next=true` | одна услуга |
| 3 | GET | `/api/stages/draft` | Черновик текущего пользователя (не более 1) | — | черновик или null |
| 4 | POST | `/api/stages` | Создать черновик с загрузкой файлов | form-data: title, century, sign, image (File), video (File) | созданный черновик |
| 5 | PUT | `/api/stages/publish` | Опубликовать черновик (status → published) | JSON: title, description, century, sign | опубликованная услуга |
| 6 | DELETE | `/api/stages/:id` | Soft-delete (status → deleted через SQL UPDATE) | path: id | `{ message, status }` |
| 7 | POST | `/api/stages/:id/like` | Поставить/снять лайк | path: id, JSON: `{ value: 0 или 1 }` | `{ liked, count }` |

### Домен «Пользователи»

| № | Метод | URL | Описание | Вход | Выход |
|---|---|---|---|---|---|
| 8 | POST | `/api/auth/register` | Регистрация | JSON: email, password, username | созданный пользователь |
| 9 | POST | `/api/auth/login` | Аутентификация (ставит cookie sessionId) | JSON: email, password | `{ user }` + `Set-Cookie: sessionId=...` |
| 10 | POST | `/api/auth/logout` | Деавторизация (удаляет сессию из Redis и cookie) | — | `{ ok: true }` |
| 11 | GET | `/api/auth/me` | Информация о текущем пользователе | cookie sessionId | `{ id, email, username, role }` |

---

## SSR-страницы (Handlebars)

| URL | Описание |
|---|---|
| `/feed` | Лента: видео на весь экран + заголовок, описание, поля, лайк, стрелка |
| `/feed/:id` | Лента с указанной карточки |
| `/feed/:id?next=true` | Следующая карточка после id |
| `/add` | Создание черновика (если черновика нет) / публикация (если есть) |
| `/stages` | Плитка 2 колонки, фильтр по веку, кнопка 🗑 |
| `/login` | Форма входа |
| `/register` | Форма регистрации |

---

## Статусы услуги

- `draft` — черновик, создан через POST /api/stages
- `published` — опубликован через PUT /api/stages/publish
- `deleted` — удалён через DELETE /api/stages/:id (soft-delete)
- Удалённые услуги **не показываются** в `/api/stages` и `/api/feed`

---

## Аутентификация

- **Сессионная** — при login сервер создаёт запись в Redis: `session:<uuid>` → `userId`
- Клиент получает cookie `sessionId`
- Все защищённые методы читают cookie, находят в Redis userId
- При logout сессия удаляется из Redis, cookie очищается

---

## Хранение файлов

- Изображения и видео — в **MinIO**, бакет `media`
- В БД хранятся только **имена файлов** (на латинице, генерируются автоматически: `img-<timestamp>.jpg`, `vid-<timestamp>.mp4`)
- Дефолтные заглушки — в `public/img/default-image.jpg` и `public/img/default-video.mp4` (SSR-сервер)

---

## Скрипты

```bash
npm run start:dev    # запуск с hot-reload
npm run start:prod   # прод-режим
npm run build        # сборка
npm run test         # unit-тесты
```
