# Snapshot CMS: настройка и эксплуатация

## Что создаёт миграция

CMS хранит весь публикуемый каталог и редакционный контент одним JSON-снимком. Каждый снимок неизменяем, а публикация новой версии выполняется одной транзакцией.

- `cms_snapshots` — append-only история содержимого. Ревизии начинаются с `0`.
- `cms_state` — единственная строка с активными `snapshot_id` и `revision`.
- `cms_audit_log` — неизменяемый журнал успешных публикаций.
- `media_assets` — append-only метаданные файлов из bucket `cms-media`.
- `contact_requests` — заявки с публичной формы и их рабочие статусы в админке.
- `cms_current_snapshot` и `cms_get_current_snapshot()` — чтение активной версии.
- `cms_commit_snapshot(...)` — единственный разрешённый путь публикации.

Начальный снимок имеет следующий вид:

```json
{
  "schemaVersion": 1,
  "products": [],
  "news": []
}
```

В миграциях включён RLS без разрешающих политик. Роли `anon` и `authenticated` не могут читать или менять CMS-таблицы и заявки. Сервер читает снимки, принимает заявки и вызывает RPC с ролью `service_role`; прямые `UPDATE` и `DELETE` снимков, аудита и media metadata запрещены дополнительно триггерами.

## Применение миграции

1. Создайте отдельный production-проект Supabase и выберите регион рядом с Vercel Functions.
2. Свяжите локальный проект:

   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Проверьте SQL на отдельном development-проекте, затем примените миграцию:

   ```bash
   supabase db push
   ```

4. В Table Editor должны появиться пять таблиц, включая `contact_requests`, активная ревизия `0` и bucket `cms-media`.
5. В production не редактируйте `cms_state`, `cms_snapshots` и `cms_audit_log` вручную. Любая публикация должна идти через `cms_commit_snapshot`.

## Переменные окружения

Для будущей интеграции приложения задайте в Vercel переменные отдельно для Preview и Production:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=scrypt:GENERATED_SALT:GENERATED_HASH
ADMIN_SESSION_SECRET=AT_LEAST_32_RANDOM_CHARACTERS
```

Production должен использовать только production-проект Supabase. В Preview задайте URL и secret key отдельного development/staging-проекта. Если отдельного проекта пока нет, не добавляйте production `SUPABASE_SECRET_KEY` в Preview и отключите там все CMS-записи. Preview deployment никогда не должен получать production secret: он работает как `service_role` и обходит RLS.

Для старого проекта вместо `SUPABASE_SECRET_KEY` может использоваться legacy `SUPABASE_SERVICE_ROLE_KEY`. Предпочтителен новый secret key.

Правила безопасности:

- `SUPABASE_SECRET_KEY` или `SUPABASE_SERVICE_ROLE_KEY` никогда не должны иметь префикс `NEXT_PUBLIC_`.
- Secret/service-role key нельзя передавать Client Component, браузеру, Storage upload-форме, логам или analytics.
- Вход расположен на `/genlix-admin/login`. Каждый Server Action и Route Handler повторно проверяет подписанную HttpOnly-сессию администратора.
- Локально без `.env.local` временно работает `admin / admin`. В production эта связка блокируется кодом; задайте длинный пароль и его scrypt-хеш.
- Хеш создаётся командой `node scripts/hash-admin-password.mjs "ДЛИННЫЙ-ПАРОЛЬ"`. Обычный пароль в Git не добавляйте.
- Значение `actor` формирует сервер из проверенной сессии, а не принимает как доверенную строку из формы.
- До добавления второго редактора однопользовательскую авторизацию обязательно заменить на Supabase Auth с invite-only доступом и TOTP MFA; схема снимков от этого не меняется.

## Чтение и атомарная публикация

Текущий снимок читается сервером:

```sql
select * from public.cms_current_snapshot;
```

View и совместимая функция `cms_get_current_snapshot()` возвращают одинаковый контракт: `revision`, `schema_version`, `content`, `checksum`, `created_at`, `actor`, `reason`.

RPC публикации принимает именованные аргументы `p_expected_revision`, `p_content`, `p_checksum`, `p_actor`, `p_reason` и после успешной транзакции возвращает тот же набор полей.

Сценарий сохранения:

1. Сервер читает активный снимок и его `revision`.
2. Редактор меняет копию JSON.
3. Сервер валидирует документ по версионированной прикладной схеме и отклоняет неизвестные поля.
4. Сервер запрашивает канонический checksum через RPC `cms_calculate_checksum`.
5. Сервер вызывает `cms_commit_snapshot`, передавая прочитанную ревизию как `p_expected_revision`.
6. После успешного RPC приложение инвалидирует Next.js cache tags/paths каталога и новостей.

Пример первой публикации после миграции:

```sql
with next_content as (
  select '{
    "schemaVersion": 1,
    "products": [],
    "news": []
  }'::jsonb as value
)
select committed.*
from next_content
cross join lateral public.cms_commit_snapshot(
  p_expected_revision => 0,
  p_content => next_content.value,
  p_checksum => public.cms_calculate_checksum(next_content.value),
  p_actor => 'user:00000000-0000-0000-0000-000000000000',
  p_reason => 'Initial content import'
) as committed;
```

Checksum вычисляется из канонического представления PostgreSQL `jsonb`, поэтому для RPC безопаснее сначала вызвать `cms_calculate_checksum(content)`. Не следует считать, что обычный `JSON.stringify()` даст те же байты.

`cms_commit_snapshot` блокирует строку `cms_state`, сравнивает активную ревизию с `p_expected_revision`, создаёт снимок, переключает active pointer и пишет audit log в одной транзакции. При одновременном редактировании устаревший запрос получает SQLSTATE `40001` (`CMS revision conflict`). Клиент должен:

1. заново загрузить активный снимок;
2. показать редактору конфликт или повторно применить его изменения;
3. посчитать новый checksum;
4. повторить commit с новой `p_expected_revision`.

Нельзя автоматически повторять публикацию со старым документом: это затрёт более свежие правки новым номером ревизии.

Чтобы вернуть старую версию, возьмите её `content` из `cms_snapshots` и опубликуйте как **новую** ревизию с причиной rollback. Переключать `cms_state` назад и удалять историю нельзя.

## Медиафайлы

Bucket `cms-media` публичен только для чтения через URL/CDN. Миграция намеренно не создаёт write-policy для `anon` или `authenticated`.

Правильный поток загрузки:

1. Сервер проверяет сессию администратора, MIME type, сигнатуру файла, размер (до 3 МБ) и безопасное разрешение изображения. Разрешены JPEG, PNG и WebP.
2. Сервер выдаёт одноразовое разрешение на прямую загрузку либо выполняет доверенную server-side загрузку.
3. Используется новый путь, например `products/PRODUCT_ID/UUID.webp`.
4. Загрузка всегда выполняется с `upsert: false`.
5. После успешной загрузки сервер добавляет строку в `media_assets`.
6. `media_assets` хранит `bucket_id` и `object_path`, а следующий CMS snapshot — постоянный публичный URL объекта. Secret и временные signed URL в снимок не попадают.

Объекты считаются неизменяемыми:

- не перезаписывать файл по существующему пути;
- новая версия изображения всегда получает новый UUID/path;
- не удалять файл автоматически, когда он исчез из текущего снимка;
- не запускать автоматический orphan cleanup;
- физическое удаление допустимо только как отдельная ручная операция после проверки ссылок, наличия off-site backup и зафиксированного решения ответственного лица.

`media_assets` также append-only. Если файл больше не используется, отсутствие ссылки в новых CMS snapshots является достаточным признаком; старая ревизия всё ещё может на него ссылаться.

## Резервные копии

Для production рекомендуется Supabase Pro:

- Supabase выполняет ежедневные резервные копии базы данных; на Pro доступно 7 дней истории daily backups.
- Эти копии содержат `cms_snapshots`, `cms_state`, `cms_audit_log` и строки `media_assets`.
- **Storage objects не входят в backup базы данных.** В БД сохраняются только их метаданные.
- В Supabase Storage нет S3 object versioning; удалённый объект нельзя восстановить из DB backup.

Минимальная политика:

1. Ежедневные managed DB backups на Pro.
2. Еженедельно создавать отдельно schema dump и data dump, затем копировать оба файла в зашифрованное off-site хранилище:

   ```bash
   supabase db dump --linked -f database-schema.sql
   supabase db dump --linked --data-only --use-copy -f database-data.sql
   ```

   Обычный `supabase db dump` содержит схему, но не данные CMS; поэтому `--data-only` обязателен для второго файла.
3. Еженедельно копировать весь bucket `cms-media` через S3-compatible endpoint в новую датированную append-only папку с помощью `rclone copy`, AWS CLI или другого S3-клиента. Не использовать `sync`, удаление лишних файлов или перезапись предыдущего комплекта: удаление в production не должно распространяться на backup.
4. Хранить минимум четыре недельных и шесть месячных комплектов DB + media manifest.
5. После каждой датированной copy-операции проверять количество объектов, общий размер и checksum manifest.
6. Раз в квартал выполнять тестовое восстановление в отдельный Supabase-проект.

Пример структуры комплекта:

```text
genlix-backup-2026-08-31/
  database-schema.sql
  database-data.sql
  cms-media/
  media-manifest.sha256
  restore-notes.txt
```

Off-site означает хранилище, не зависящее от production-проекта Supabase. Для небольшого объёма можно использовать зашифрованный приватный GitHub Release в отдельном backup-репозитории или физически отдельное объектное хранилище. Обычные GitHub Actions artifacts имеют срок хранения и не должны быть единственной резервной копией.

Перед production-запуском обязательно выполните полный restore drill: восстановите DB, загрузите bucket, сравните checksums, откройте текущий снимок и несколько старых ревизий.

## Контрольный список production

- [ ] Миграция применена сначала к development-проекту.
- [ ] `anon` и `authenticated` не могут выполнить CMS RPC или прочитать таблицы.
- [ ] Secret/service-role key существует только в server-side environment.
- [ ] Для текущего единственного администратора заданы уникальные длинные `ADMIN_PASSWORD_HASH` и `ADMIN_SESSION_SECRET`; fallback `admin / admin` в production не работает.
- [ ] До добавления второго редактора выполнен обязательный переход на Supabase Auth с invite-only доступом и TOTP MFA.
- [ ] Сервер валидирует версионированную схему CMS до commit и ограничивает размер снимка.
- [ ] На `/genlix-admin/login` включено распределённое ограничение частоты запросов в Vercel Firewall или другом edge-слое; встроенный process-local limiter сам по себе для serverless недостаточен.
- [ ] Конфликт SQLSTATE `40001` корректно показывается редактору.
- [ ] Upload использует уникальный path и `upsert: false`.
- [ ] Автоматическое удаление и overwrite медиа отсутствуют.
- [ ] Daily DB backup и weekly dated append-only off-site media copy включены; `sync` не используется.
- [ ] Процедура восстановления проверена на отдельном проекте.
