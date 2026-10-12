# Letters Evolution Stages + PostgreSQL 

Лабораторная работа №2: перенос данных из массива в PostgreSQL через TypeORM.
Тема: **этапы-интервалы эволюции написания букв** (начертание «ять», твёрдый знак «ъ», «фита»).

## Стек

- **NestJS** + TypeScript
- **TypeORM** + PostgreSQL (порт 5433)
- **Handlebars** — SSR-шаблоны
- **MinIO** — S3-хранилище для изображений и видео
- **Docker Compose** — postgres, adminer, minio
- **Adminer** — веб-интерфейс для работы с БД

## Запуск

```bash
docker-compose up -d
npm install
npm run start:dev
```

Приложение: http://localhost:3000
Adminer:     http://localhost:8081 (Server: postgres, User: myuser, Pass: mypassword, DB: stages_db)
MinIO:       http://localhost:9001 (root / rootpassword)

## Переменные окружения (`.env`)

```
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=myuser
DB_PASSWORD=mypassword
DB_DATABASE=stages_db
```

## Таблицы БД

### `letters_evolution_stages` — услуги (этапы эволюции письма)

| Поле | Тип | Описание |
|---|---|---|
| id | SERIAL, PK | Идентификатор |
| title | VARCHAR(200) | Название этапа |
| description | TEXT | Подробное описание |
| status | VARCHAR(20) | draft / published / deleted |
| imageUrl | VARCHAR(200), NULL | Имя файла изображения в MinIO |
| videoUrl | VARCHAR(200), NULL | Имя файла видео в MinIO |
| century | INTEGER | Век (поле по теме 1) |
| sign | VARCHAR(50) | Признак («Ять») (поле по теме 2) |
| createdAt | TIMESTAMP | Дата создания |
| updatedAt | TIMESTAMP, NULL | Дата обновления |
| creatorId | INTEGER, FK, NULL | → letters_evolution_stages_users.id |

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

## SSR-страницы

| URL | Описание |
|---|---|
| `/feed` | Лента: видео на весь экран + поля + лайк + стрелка |
| `/feed/:id` | Лента с указанной карточки |
| `/feed/:id?next=true` | Следующая после id |
| `/add` | Создание черновика (если нет) / публикация (если есть) |
| `/stages` | Плитка 2 колонки с фильтром по веку, кнопка 🗑 для удаления |

## Статусы

- `draft` — черновик (создаётся кнопкой «Далее»)
- `published` — опубликован (кнопкой «Опубликовать»)
- `deleted` — мягко удалён (soft-delete через SQL UPDATE)

Удалённые услуги **не показываются** в `/stages` и `/feed`.

## Основные методы (внутренние, до лабы 3)

| Тип | Где | Что делает |
|---|---|---|
| ORM | `service.getPublishedFiltered()` | Список опубликованных с фильтром по веку |
| ORM | `service.getDraft()` | Черновик текущего пользователя |
| ORM | `service.createDraft()` | Создать черновик (POST /add) |
| ORM | `service.publish()` | Опубликовать черновик (POST /publish) |
| SQL UPDATE | `service.softDelete()` | Мягкое удаление (POST /delete-stage) |
| SQL SELECT | `service.getByIdRaw()` | Одна строка ленты через сырой SQL (курсор) |

## Миграции и синхронизация

- В `app.module.ts` стоит `synchronize: true` — таблицы создаются автоматически при запуске
- Для полного сброса БД — в Adminer выполнить `DROP TABLE ... CASCADE` и перезапустить NestJS

## Заполнение БД

Данные заливаются через **Adminer** (`http://localhost:8081`) вручную:

- 1 пользователь (`user@test.com` / `123456`)
- 5 услуг (3 published, 1 draft, 1 deleted)
- Несколько строк в `likes` для демонстрации

Пример SQL:

```sql
INSERT INTO letters_evolution_stages_users (email, username, password, role)
VALUES ('user@test.com', 'student', '123456', 'user');
```

## Особенности

- **БД вместо массива** — источник данных PostgreSQL
- **Soft-delete** — удалённые записи остаются в БД со `status = 'deleted'`
- **FK без каскада** — при удалении пользователя услуги остаются
- **Медиа в MinIO** — дефолтные заглушки в `public/img/`
- Сохранены все SSR-страницы из лабы 1, но данные теперь из БД
