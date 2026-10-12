# Lab 1 — Letters Evolution Stages (SSR)

Лабораторная работа №1: базовый интерфейс на NestJS + Handlebars.
Тема: **этапы-интервалы эволюции написания букв** (начертание «ять», твёрдый знак «ъ», «фита»).

## Стек

- **NestJS** + TypeScript
- **Handlebars** — SSR-шаблоны (`.hbs`)
- **MinIO** — S3-хранилище для изображений и видео
- **Docker Compose** — postgres, adminer, minio

## Запуск

```bash
docker-compose up -d
npm install
npm run start:dev
```

Приложение: http://localhost:3000
MinIO:       http://localhost:9001 (root / rootpassword)
Adminer:     http://localhost:8081 (Server: postgres, User: myuser, Pass: mypassword, DB: stages_db)

## Структура

```
src/
├── main.ts                                точка входа, настройка Handlebars и статики
├── app.module.ts                          корневой модуль
└── letters_evolution_stages/
    ├── letters_evolution_stages.module.ts
    ├── letters_evolution_stages.controller.ts
    ├── letters_evolution_stages.service.ts   коллекция услуг в памяти (массив)
    └── manuscript.interface.ts               тип услуги

views/
├── partials/
│   └── navbar.hbs           нижняя панель с 3 вкладками
├── feed.hbs                 страница «Лента»
├── add.hbs                  страница «Добавить»
└── tile.hbs                 страница «Рукописи» (плитка)

public/
├── style.css                стили приложения
├── fonts/                   шрифт LeksaSansPro
└── img/
    ├── default-image.jpg    дефолтное изображение
    └── default-video.mp4    дефолтное видео
```

## SSR-страницы

| URL | Описание |
|---|---|
| `/feed` | Лента: видео на весь экран, поверх — заголовок, описание, 2 поля по теме, лайк, стрелка «следующий» |
| `/feed/:id` | Лента с указанной карточки |
| `/feed/:id?next=true` | Следующая карточка после id |
| `/add` | Форма создания/публикации (без сохранения — данные не уходят на сервер) |
| `/stages` | Плитка 2 колонки, фильтр по веку, клик по карточке → лента |

## Модель данных (в памяти, без БД)

```ts
interface LetterEvolutionStage {
  id: number;
  title: string;              // название этапа
  description: string;        // описание
  century: number;            // век (поле по теме 1)
  sign: string;               // признак, например «Ять» (поле по теме 2)
  image: string;              // ключ изображения в MinIO
  video: string;              // ключ видео в MinIO
  status: 'draft' | 'published' | 'deleted';
  likes: number[];            // массив ID пользователей
}
```

## Хранение медиа

- Изображения и видео — в **MinIO**, бакет `media`
- В коде хранятся только **имена файлов** (`ostromir.jpg`, `ostromir.mp4` и т.д.)
- URL в шаблонах формируется как `http://localhost:9000/media/<имя>`

## Статусы

- `draft` — черновик
- `published` — опубликован
- `deleted` — удалён (не отображается в UI)

## Особенности

- **Без JavaScript** — только HTML + CSS + Handlebars
- **Без БД** — все данные в массиве `stages` в сервисе
- **Без сохранения** — форма на `/add` не отправляет данные на сервер
- Стиль повторяет мобильный формат TikTok (390×781)
- Палитра: `#EEEEEE`, `#B59974`, `#504127` (коричневые кнопки)
