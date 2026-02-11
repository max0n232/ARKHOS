# План: Контент-Завод для Studioköök

## Обзор

Создание автоматизированной системы генерации и публикации контента в соцсети через n8n workflows с Telegram-триггером.

**Цель:** Автоматизировать 95% процесса создания контента от команды в Telegram до публикации в Instagram, Facebook, Telegram, TikTok.

**Стек технологий:**
- n8n (self-hosted на https://n8n.studiokook.ee)
- KIE.ai API для AI генерации
- WordPress NextGEN Gallery (библиотека готовых фото)
- Telegram Bot (триггер и интерфейс)
- Meta Business API (Instagram/Facebook)
- OpenAI GPT-4 (текстовая генерация)

---

## Архитектура системы

### 4 основных n8n Workflow:

```
Telegram Bot
     │
     ▼
┌────────────────────┐
│ 1. Master Router   │ ← Парсинг команд, маршрутизация
└────────┬───────────┘
         │
    ┌────┼────┬─────────┐
    ▼    ▼    ▼         ▼
┌───────┐ ┌────┐ ┌──────┐ ┌──────┐
│Content│ │Sched│ │Publi │ │Galle │
│ Gen   │ │uler │ │sher  │ │ry   │
└───────┘ └────┘ └──────┘ └──────┘
    │              │
    └──────┬───────┘
           ▼
    [Все соцсети]
```

---

## Детальный план реализации

### Фаза 1: Базовая инфраструктура (2-3 часа)

#### 1.1 Настройка Telegram Bot
**Файл:** n8n workflow `TG_Bot_Setup`

**Шаги:**
1. Создать Telegram Bot через BotFather (если ещё нет)
2. Получить Bot Token
3. Сохранить в n8n credentials (`telegram_bot_studiokook`)
4. Создать базовый webhook workflow:
   - Нода: `Telegram Trigger` → webhook mode
   - URL: `https://n8n.studiokook.ee/webhook/telegram-content-factory`

**Тестирование:** Отправить `/start` боту, получить ответ.

#### 1.2 Настройка API ключей
**Локация:** n8n Credentials Manager

Создать credentials для:
- **KIE.ai API Key**
  - Type: Header Auth
  - Name: `Authorization`
  - Value: `Bearer [API_KEY]`

- **OpenAI API Key**
  - Type: OpenAI API

- **Pexels API Key**
  - Type: Header Auth
  - Name: `Authorization`

- **Meta Business Access Token**
  - Type: OAuth2
  - Scope: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`, `pages_manage_posts`

**Тестирование:** Проверить каждый credential через простой HTTP Request.

---

### Фаза 2: Master Router Workflow (1-2 часа)

**Файл:** `ContentFactory_MasterRouter.json`

#### Структура workflow:

```
Telegram Trigger
    ↓
Code: Parse Command
    ↓
Switch: Command Type
    ├→ /create_post → Execute: Content Generator
    ├→ /schedule → Execute: Scheduler
    ├→ /publish → Execute: Publisher
    ├→ /gallery → Execute: Gallery Browser
    ├→ /status → Query: Schedule DB
    ├→ /help → Telegram: Send Help
    └→ default → Telegram: Error message
```

#### Ключевые ноды:

**1. Telegram Trigger**
- Updates: `message`, `callback_query`
- Mode: Webhook

**2. Code Node: Command Parser**
```javascript
const message = $input.item.json.message?.text || '';
const userId = $input.item.json.message?.from.id;
const chatId = $input.item.json.message?.chat.id;

// Parse command
const commandMatch = message.match(/^\/(\w+)(?:\s+(.*))?$/);
if (!commandMatch) {
  return {
    error: true,
    message: 'Invalid command. Type /help'
  };
}

const [, command, params] = commandMatch;

return {
  command,
  params: params || '',
  user_id: userId,
  chat_id: chatId,
  timestamp: new Date().toISOString()
};
```

**3. Switch Node**
- Mode: Rules
- Routes:
  - `{{ $json.command === 'create_post' }}`
  - `{{ $json.command === 'schedule' }}`
  - `{{ $json.command === 'publish' }}`
  - `{{ $json.command === 'gallery' }}`
  - `{{ $json.command === 'status' }}`
  - `{{ $json.command === 'help' }}`

**4. Execute Workflow Nodes** (по одному для каждого route)
- Wait for sub-workflow: ✓ Yes

**Критические файлы:**
- `n8n_workflows/master_router.json`
- `config/telegram_commands.json` (документация команд)

**Тестирование:**
```
/help → получить список команд
/create_post → запустить Content Generator
/gallery → запустить Gallery Browser
```

---

### Фаза 3: Content Generator Workflow (4-5 часов)

**Файл:** `ContentFactory_ContentGenerator.json`

Это самый сложный workflow. Разделим на подзадачи:

#### 3.1 Выбор источника медиа

**Switch Node: Media Source Selection**

Логика выбора:
- 70% постов: WordPress Gallery (бесплатно)
- 30% постов: KIE.ai генерация ($0.04/изображение)
- Fallback: Pexels (бесплатно, если AI fail)

```javascript
// Code Node: Select Source
const random = Math.random();
const hasGalleryPhotos = true; // TODO: check WordPress

if (hasGalleryPhotos && random < 0.7) {
  return { source: 'wordpress' };
} else if (random < 0.95) {
  return { source: 'ai' };
} else {
  return { source: 'pexels' };
}
```

#### 3.2 Route A: WordPress Gallery

**HTTP Request Node: WordPress MCP**
```
Method: POST
URL: {{$env.WORDPRESS_MCP_URL}}/execute-ability
Body:
{
  "ability_name": "ngg-gallery/list-galleries",
  "parameters": {}
}
```

**Code Node: Pick Random Gallery**
```javascript
const galleries = $input.item.json.galleries;
const randomGallery = galleries[Math.floor(Math.random() * galleries.length)];
return { gallery_id: randomGallery.id };
```

**HTTP Request Node: Get Images**
```
Method: POST
Body:
{
  "ability_name": "ngg-gallery/list-images",
  "parameters": {
    "gallery_id": "{{$json.gallery_id}}"
  }
}
```

**Code Node: Pick Random Image**
```javascript
const images = $input.item.json.images;
const randomImage = images[Math.floor(Math.random() * images.length)];
return {
  image_url: randomImage.url,
  image_description: randomImage.description || randomImage.alttext || '',
  source: 'wordpress',
  cost: 0
};
```

#### 3.3 Route B: AI Generation (KIE.ai)

**Code Node: Create AI Prompt**
```javascript
const prompts = [
  'modern Scandinavian kitchen design, bright natural light, minimalist, wood accents --ar 4:5 --v 6',
  'luxury Estonian kitchen interior, marble countertops, professional lighting --ar 4:5 --v 6',
  'cozy kitchen with island, warm atmosphere, family-friendly design --ar 4:5 --v 6',
  'contemporary kitchen with smart storage solutions, clean lines --ar 4:5 --v 6'
];

const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

return {
  prompt: randomPrompt,
  model: 'midjourney', // or 'flux1' for cheaper
  aspect_ratio: '4:5'
};
```

**HTTP Request Node: KIE.ai Generate**
```
Method: POST
URL: https://api.kie.ai/v1/generate/image
Headers:
  Authorization: Bearer {{$credentials.kieai.apiKey}}
  Content-Type: application/json
Body:
{
  "model": "{{$json.model}}",
  "prompt": "{{$json.prompt}}",
  "aspect_ratio": "{{$json.aspect_ratio}}",
  "quality": "high"
}
```

**Wait Node** (если KIE.ai возвращает job_id)
- Mode: Webhook response
- Resume on: Polling KIE.ai status endpoint
- Timeout: 5 minutes

**Error Handler:** IF KIE.ai fails → Switch to Pexels

#### 3.4 Route C: Pexels Fallback

**HTTP Request Node: Pexels API**
```
Method: GET
URL: https://api.pexels.com/v1/search
Query Parameters:
  query: modern kitchen design
  per_page: 15
  orientation: portrait
Headers:
  Authorization: {{$credentials.pexels.apiKey}}
```

**Code Node: Random Pick**
```javascript
const photos = $input.item.json.photos;
const random = photos[Math.floor(Math.random() * photos.length)];

return {
  image_url: random.src.large2x,
  photographer: random.photographer,
  attribution: `Photo by ${random.photographer} on Pexels`,
  source: 'pexels',
  cost: 0
};
```

#### 3.5 Merge Routes → Text Generation

**Merge Node** (wait for all routes)

**OpenAI Node: Analyze Image (Vision API)**
```
Resource: Chat
Model: gpt-4-vision-preview
Messages:
[
  {
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "Analyze this kitchen image briefly: style, key features, color palette, mood. Keep it 2-3 sentences."
      },
      {
        "type": "image_url",
        "image_url": {
          "url": "{{$json.image_url}}"
        }
      }
    ]
  }
]
```

**Parallel Text Generation:**

**Branch A: Estonian Text**
```
OpenAI Node:
Model: gpt-4-turbo
Prompt:
Loo köitev Instagram postitus köögidisaini kohta.

Kontekst: {{$json.image_description}}

Nõuded:
- Pikkus: 150-200 tähemärki
- Tooni: professionaalne, inspireeriv
- Lisa kutse tegutsemisele (CTA)
- Kasuta 2-3 emoji'sid
- Lõpu lisa 5-7 hashtag'i (#köök #köögimööbel #tallinn jne)

Formaat:
[Köitev hook] [emoji]
[Põhisõnum]
[Detail]

[CTA] 👉 [Tegevus]

#hashtag1 #hashtag2 ...
```

**Branch B: Russian Text**
```
OpenAI Node:
Model: gpt-4-turbo
Prompt:
Создай увлекательный пост для Instagram о дизайне кухни.

Контекст: {{$json.image_description}}

Требования:
- Длина: 150-200 символов
- Тон: профессиональный, вдохновляющий
- Добавь призыв к действию (CTA)
- Используй 2-3 эмодзи
- В конце добавь 5-7 хэштегов (#кухня #дизайн #таллинн и т.д.)

Формат:
[Захватывающий хук] [emoji]
[Основное сообщение]
[Деталь]

[CTA] 👉 [Действие]

#хэштег1 #хэштег2 ...
```

**Merge Texts:**

**Code Node: Combine Bilingual Text**
```javascript
const textEt = $node["OpenAI Estonian"].json.choices[0].message.content;
const textRu = $node["OpenAI Russian"].json.choices[0].message.content;

return {
  text_combined: `${textEt}\n\n---\n\n${textRu}`,
  text_estonian: textEt,
  text_russian: textRu
};
```

#### 3.6 Platform Optimization

**Code Node: Optimize for Each Platform**
```javascript
const truncate = (str, max) => str.length > max ? str.substring(0, max - 3) + '...' : str;

const media = {
  url: $json.image_url,
  source: $json.source
};

return {
  draft_id: crypto.randomUUID(),
  created_at: new Date().toISOString(),
  platforms: {
    instagram: {
      text: $json.text_combined.substring(0, 2200),
      media: { url: media.url, aspect_ratio: '4:5' },
      enabled: true
    },
    facebook: {
      text: $json.text_combined,
      media: { url: media.url, aspect_ratio: '1.91:1' },
      enabled: true
    },
    telegram: {
      text: `*${$json.text_estonian}*\n\n${$json.text_russian}`,
      media: { url: media.url },
      parse_mode: 'Markdown',
      enabled: true
    },
    tiktok: {
      text: truncate($json.text_combined, 150),
      media: { url: media.url },
      enabled: false // Требует видео
    }
  },
  metadata: {
    source: media.source,
    cost_usd: media.source === 'ai' ? 0.04 : 0
  }
};
```

#### 3.7 Save Draft

**Google Drive Node: Create Draft File**
```
Operation: Upload
Parent Folder: ContentFactory/Drafts/{{$now.format('YYYY-MM')}}
File Name: draft_{{$json.draft_id}}.json
Content: {{JSON.stringify($json, null, 2)}}
```

#### 3.8 Send Preview to Telegram

**Code Node: Create Preview Message**
```javascript
const draft = $json;
const previewText = `
📱 *Новый контент готов!*

🇪🇪 ${draft.platforms.instagram.text.substring(0, 100)}...

🇷🇺 ${draft.platforms.telegram.text.substring(0, 100)}...

💰 Стоимость: $${draft.metadata.cost_usd}
📸 Источник: ${draft.metadata.source}

ID: \`${draft.draft_id}\`
`;

return {
  text: previewText,
  draft_id: draft.draft_id,
  media_url: draft.platforms.instagram.media.url
};
```

**Telegram Node: Send Photo with Inline Keyboard**
```
Operation: Send Photo
Chat ID: {{$node["Telegram Trigger"].json.message.chat.id}}
Photo: {{$json.media_url}}
Caption: {{$json.text}}
Parse Mode: Markdown
Reply Markup:
{
  "inline_keyboard": [
    [
      {"text": "✅ Опубликовать сейчас", "callback_data": "publish_now_{{$json.draft_id}}"},
      {"text": "📅 Запланировать", "callback_data": "schedule_{{$json.draft_id}}"}
    ],
    [
      {"text": "✏️ Редактировать", "callback_data": "edit_{{$json.draft_id}}"},
      {"text": "🔄 Пересоздать", "callback_data": "regenerate_{{$json.draft_id}}"}
    ],
    [
      {"text": "❌ Отменить", "callback_data": "discard_{{$json.draft_id}}"}
    ]
  ]
}
```

**Критические файлы:**
- `n8n_workflows/content_generator.json`
- `config/ai_prompts.json` (шаблоны промптов)
- `config/platform_specs.json` (спецификации платформ)

**Тестирование:**
```
/create_post → должен:
1. Выбрать источник медиа
2. Сгенерировать или получить изображение
3. Создать билингвальный текст
4. Отправить preview в Telegram с кнопками
```

---

### Фаза 4: Publisher Workflow (3-4 часа)

**Файл:** `ContentFactory_Publisher.json`

#### Trigger

**Execute Workflow Trigger** OR **Telegram Callback Query**

**IF Node: Check Trigger Type**
- IF callback_query → Extract draft_id
- IF execute_workflow → Use provided draft_id

#### Load Draft

**Google Drive Node: Get Draft File**
```
Operation: Download
File ID: Search by name "draft_{{$json.draft_id}}.json"
```

**Code Node: Parse Draft JSON**
```javascript
const draftContent = JSON.parse($input.item.binary.data.toString('utf8'));
return draftContent;
```

#### Parallel Publication

**Switch Node: Publication Strategy**
- Mode: Parallel (все платформы одновременно)
- Timeout: 5 min per branch

**Branch 1: Instagram (через Meta Graph API)**

**Function Node: Instagram Preparation**
```javascript
// Instagram requires 2-step process:
// 1. Create media container
// 2. Publish container

return {
  image_url: $json.platforms.instagram.media.url,
  caption: $json.platforms.instagram.text,
  instagram_account_id: '{{$env.INSTAGRAM_ACCOUNT_ID}}'
};
```

**HTTP Request: Create Media Container**
```
Method: POST
URL: https://graph.facebook.com/v18.0/{{$json.instagram_account_id}}/media
Body:
{
  "image_url": "{{$json.image_url}}",
  "caption": "{{$json.caption}}",
  "access_token": "{{$credentials.meta.accessToken}}"
}
```

**HTTP Request: Publish Media**
```
Method: POST
URL: https://graph.facebook.com/v18.0/{{$json.instagram_account_id}}/media_publish
Body:
{
  "creation_id": "{{$json.id}}",
  "access_token": "{{$credentials.meta.accessToken}}"
}
```

**Branch 2: Facebook**

**HTTP Request: Facebook Post**
```
Method: POST
URL: https://graph.facebook.com/v18.0/{{$env.FACEBOOK_PAGE_ID}}/photos
Body:
{
  "url": "{{$json.platforms.facebook.media.url}}",
  "message": "{{$json.platforms.facebook.text}}",
  "published": true,
  "access_token": "{{$credentials.meta.accessToken}}"
}
```

**Branch 3: Telegram Channel**

**Telegram Node: Send Photo**
```
Operation: Send Photo
Chat ID: @studiokook_channel  // или ID канала
Photo: {{$json.platforms.telegram.media.url}}
Caption: {{$json.platforms.telegram.text}}
Parse Mode: {{$json.platforms.telegram.parse_mode}}
```

**Branch 4: TikTok (опционально, если видео)**

**IF Node: Check if Video Available**
```javascript
return $json.platforms.tiktok.enabled && $json.platforms.tiktok.media.type === 'video';
```

**HTTP Request: Blotato API (TikTok uploader)**
```
Method: POST
URL: https://api.blotato.com/v1/tiktok/upload
Headers:
  Authorization: Bearer {{$credentials.blotato.apiKey}}
Body:
{
  "video_url": "{{$json.platforms.tiktok.media.url}}",
  "caption": "{{$json.platforms.tiktok.text}}",
  "privacy_level": "PUBLIC_TO_EVERYONE"
}
```

#### Merge Results

**Merge Node** (wait for all branches)

**Code Node: Analyze Publication Results**
```javascript
const results = {
  instagram: $node["Instagram Publish"].json,
  facebook: $node["Facebook Post"].json,
  telegram: $node["Telegram Send"].json
};

const successful = [];
const failed = [];

Object.entries(results).forEach(([platform, result]) => {
  if (result.error || !result.id) {
    failed.push({
      platform,
      error: result.error?.message || 'Unknown error'
    });
  } else {
    successful.push({
      platform,
      post_id: result.id,
      url: generatePostUrl(platform, result.id)
    });
  }
});

return {
  successful,
  failed,
  total: Object.keys(results).length,
  success_rate: successful.length / Object.keys(results).length
};
```

#### Error Handling & Retry

**IF Node: Has Failed Publications?**
```javascript
return $json.failed.length > 0;
```

**IF Yes → Loop Node** (max 3 retries)

**Wait Node** (exponential backoff: 30s, 60s, 120s)

**Execute Workflow: Retry Publication** (recursive call)

#### Update Draft Status

**Google Drive Node: Update Draft File**
```
Operation: Update
File ID: {{$json.draft_file_id}}
Content:
{
  ...draft,
  status: 'published',
  published_at: new Date().toISOString(),
  publication_results: $json.successful
}
```

#### Send Report to User

**Code Node: Create Report**
```javascript
const { successful, failed } = $json;

let report = '📊 *Отчёт о публикации*\n\n';

if (successful.length > 0) {
  report += '✅ *Успешно опубликовано:*\n';
  successful.forEach(p => {
    report += `• ${p.platform}: ${p.url}\n`;
  });
}

if (failed.length > 0) {
  report += '\n❌ *Ошибки публикации:*\n';
  failed.forEach(p => {
    report += `• ${p.platform}: ${p.error}\n`;
  });
}

report += `\n📈 Успешность: ${Math.round($json.success_rate * 100)}%`;

return { text: report };
```

**Telegram Node: Send Report**
```
Operation: Send Message
Chat ID: {{$node["Telegram Trigger"].json.message.chat.id}}
Text: {{$json.text}}
Parse Mode: Markdown
```

**Критические файлы:**
- `n8n_workflows/publisher.json`
- `config/platform_api_endpoints.json`
- `scripts/retry_logic.js` (для сложной retry логики)

**Тестирование:**
1. Создать тестовый draft
2. Вызвать Publisher с draft_id
3. Проверить публикацию на всех платформах
4. Проверить retry логику (искусственно вызвать ошибку)

---

### Фаза 5: Scheduler Workflow (1-2 часа)

**Файл:** `ContentFactory_Scheduler.json`

#### Main Scheduler Workflow

**Execute Workflow Trigger**

**Code Node: Parse Schedule Request**
```javascript
// Expects: draft_id, scheduled_datetime (ISO 8601)
const { draft_id, scheduled_datetime } = $json;

const scheduledDate = new Date(scheduled_datetime);
const now = new Date();

if (scheduledDate <= now) {
  throw new Error('Scheduled time must be in the future');
}

// Convert to Estonia timezone (UTC+2/+3)
const estoniaTime = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Tallinn',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
}).format(scheduledDate);

return {
  draft_id,
  scheduled_datetime: scheduledDate.toISOString(),
  estonia_time: estoniaTime,
  status: 'scheduled'
};
```

**Google Sheets Node: Add to Schedule**
```
Operation: Append Row
Spreadsheet: ContentFactory Schedule
Sheet: Schedule
Values:
[
  "{{$json.draft_id}}",
  "{{$json.scheduled_datetime}}",
  "{{$json.status}}",
  "{{$now.toISOString()}}"
]
```

**Telegram Node: Confirmation**
```
Text:
📅 *Публикация запланирована!*

Draft ID: `{{$json.draft_id}}`
Дата: {{$json.estonia_time}} (EET)

Статус: ⏳ Ожидание
```

#### Schedule Executor Workflow (Cron-based)

**Файл:** `ContentFactory_ScheduleExecutor.json`

**Schedule Trigger**
```
Rule: */15 * * * *  (каждые 15 минут)
```

**Google Sheets Node: Get Pending Posts**
```
Operation: Lookup
Spreadsheet: ContentFactory Schedule
Criteria:
  status = 'scheduled'
  AND scheduled_datetime <= NOW() + 15 minutes
```

**IF Node: Has Posts?**
```javascript
return $json.posts && $json.posts.length > 0;
```

**Split In Batches Node**
```
Batch Size: 1
```

**Execute Workflow: Publisher**
```
Workflow: ContentFactory_Publisher
Data:
{
  "draft_id": "{{$json.draft_id}}"
}
Wait for Completion: Yes
```

**Google Sheets Node: Update Status**
```
Operation: Update Row
Set:
  status = 'published' | 'failed'
  published_at = NOW()
```

**Telegram Node: Notify User**
```
Text:
🚀 *Автопубликация выполнена!*

Draft ID: `{{$json.draft_id}}`
Результат: {{$json.status}}
```

**Критические файлы:**
- `n8n_workflows/scheduler.json`
- `n8n_workflows/schedule_executor.json`
- Google Sheet: `ContentFactory Schedule`

**Тестирование:**
```
1. /schedule <draft_id> <future_datetime>
2. Проверить запись в Google Sheets
3. Подождать запланированного времени
4. Проверить автопубликацию
```

---

### Фаза 6: Gallery Browser Workflow (опционально, 1-2 часа)

**Файл:** `ContentFactory_GalleryBrowser.json`

Упрощённая версия для выбора фото из WordPress вручную.

**Структура:**
1. Получить список галерей (WordPress MCP)
2. Отправить в Telegram с Inline Keyboard
3. По выбору галереи → получить фото
4. Отправить превью фото с кнопкой [Use This]
5. По клику → Trigger Content Generator с выбранным фото

**Критические файлы:**
- `n8n_workflows/gallery_browser.json`

---

## Verification Plan (Как тестировать)

### 1. Модульное тестирование (по фазам)

**После Фазы 1:**
```bash
# Проверить Telegram Bot
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -d "chat_id=<YOUR_CHAT_ID>" \
  -d "text=Test message"

# Проверить n8n credentials
# В n8n UI: Settings → Credentials → Test каждый credential
```

**После Фазы 2:**
```
# Отправить в Telegram бот:
/help
Ожидается: список команд

/unknown_command
Ожидается: сообщение об ошибке
```

**После Фазы 3:**
```
# Тест Content Generator:
/create_post

Ожидается:
1. Бот генерирует контент (20-60 сек)
2. Получаете preview с фото
3. Текст на эстонском и русском
4. Кнопки [Publish] [Schedule] [Edit] [Discard]
```

**После Фазы 4:**
```
# Тест Publisher:
1. Создать пост через /create_post
2. Нажать [✅ Опубликовать сейчас]
3. Проверить публикацию:
   - Instagram: https://instagram.com/studiokook.ee
   - Facebook: https://facebook.com/<PAGE>
   - Telegram: https://t.me/<CHANNEL>

4. Проверить отчёт в Telegram
```

**После Фазы 5:**
```
# Тест Scheduler:
/schedule <draft_id> 2026-02-06T15:00:00

Ожидается:
1. Подтверждение планирования
2. Запись в Google Sheets
3. Автопубликация в назначенное время
4. Уведомление о публикации
```

### 2. Интеграционное тестирование

**End-to-End тест:**
```
Сценарий A: Полный цикл с WordPress Gallery

1. /create_post
2. Система выбирает фото из WordPress
3. Генерирует тексты (ET + RU)
4. Отправляет preview
5. Нажать [Publish]
6. Проверить публикацию на всех платформах
7. Проверить отчёт

Ожидаемое время: 2-3 минуты
Ожидаемая стоимость: $0.02 (только текст)
```

**Сценарий B: AI генерация + планирование**
```
1. /create_post
2. Система генерирует изображение через KIE.ai
3. Генерирует тексты
4. Нажать [Schedule]
5. Ввести дату/время
6. Проверить запись в расписании
7. Дождаться автопубликации

Ожидаемое время: 3-5 минут
Ожидаемая стоимость: $0.06 (AI image + текст)
```

### 3. Стресс-тестирование

**Проверка fallback-ов:**
```
1. Отключить KIE.ai API key → система должна переключиться на Pexels
2. Отключить Instagram API → система должна пропустить IG, опубликовать на остальных
3. Запланировать 10 постов на одно время → все должны опубликоваться
```

### 4. Мониторинг

**Создать Dashboard (опционально):**
- Google Sheets: расписание публикаций
- Telegram channel: логи публикаций
- n8n Executions: история всех запусков

---

## Оценка стоимости

### Инфраструктура
- n8n self-hosted: $0/месяц (уже есть на VPS)
- Google Drive: $0/месяц (в пределах бесплатного лимита)
- Telegram Bot: $0/месяц (бесплатно)

### AI сервисы (на 60 постов/месяц, ~2/день)

**Вариант A: Минимальный (Recommended)**
```
Источники:
- 70% WordPress Gallery: 42 поста × $0 = $0
- 30% KIE.ai Images: 18 постов × $0.04 = $0.72

Текст:
- OpenAI GPT-4: 60 постов × $0.02 = $1.20

Итого: $1.92/месяц
```

**Вариант B: Сбалансированный**
```
Источники:
- 50% WordPress: 30 постов × $0 = $0
- 40% KIE.ai Images: 24 поста × $0.04 = $0.96
- 10% KIE.ai Video: 6 постов × $0.40 = $2.40

Текст: $1.20

Итого: $4.56/месяц
```

**Вариант C: Премиум (много видео)**
```
Источники:
- 20% WordPress: 12 постов × $0 = $0
- 30% KIE.ai Images: 18 постов × $0.04 = $0.72
- 50% KIE.ai Video: 30 постов × $0.40 = $12.00

Текст: $1.20

Итого: $13.92/месяц
```

---

## Риски и митигация

### Риск 1: KIE.ai ненадёжность (Sora 2 API)
**Митигация:**
- Использовать Veo 3.1 вместо Sora 2 (более надёжно)
- Fallback на Pexels для фото
- Fallback на WordPress Gallery

### Риск 2: Instagram API rate limits
**Митигация:**
- Лимит: 25 постов/час
- Наш план: максимум 2 поста/день = безопасно
- Retry логика с exponential backoff

### Риск 3: Низкое качество AI текстов
**Митигация:**
- Тщательно настроенные промпты
- A/B тестирование промптов
- Preview перед публикацией (всегда можно отредактировать)

### Риск 4: WordPress NextGEN Gallery пустая
**Митигация:**
- Проверка наличия галерей в начале
- Автоматический fallback на AI/Pexels

---

## Следующие шаги после реализации

### Фаза 7: Аналитика (будущее)
- Сбор метрик публикаций (likes, comments, reach)
- Dashboard в Google Sheets
- Автоматические отчёты раз в неделю

### Фаза 8: Улучшения (будущее)
- A/B тестирование текстов
- Автоматическая оптимизация времени публикации
- Интеграция с CRM (сохранение лидов из комментариев)

---

## Критические файлы для модификации

1. **n8n_workflows/master_router.json**
   - Причина: Entry point системы, все команды проходят здесь

2. **n8n_workflows/content_generator.json**
   - Причина: Самый сложный workflow, 70% логики

3. **n8n_workflows/publisher.json**
   - Причина: Критическая логика публикации на все платформы

4. **n8n_workflows/scheduler.json**
   - Причина: Управление расписанием

5. **n8n_workflows/schedule_executor.json**
   - Причина: Cron job для автопубликации

6. **config/ai_prompts.json** (создать отдельно)
   - Причина: Централизованное хранение AI промптов

7. **config/platform_specs.json** (создать отдельно)
   - Причина: Спецификации каждой платформы

8. **Google Sheet: "ContentFactory Schedule"**
   - Причина: База данных расписания

---

## Общее время реализации

- **Фаза 1 (Инфраструктура):** 2-3 часа
- **Фаза 2 (Master Router):** 1-2 часа
- **Фаза 3 (Content Generator):** 4-5 часов
- **Фаза 4 (Publisher):** 3-4 часа
- **Фаза 5 (Scheduler):** 1-2 часа
- **Фаза 6 (Gallery Browser):** 1-2 часа (опционально)
- **Тестирование и отладка:** 3-4 часа

**Итого: 15-22 часа** (2-3 рабочих дня)

---

## Примечания

- Все credentials должны быть настроены в n8n Credentials Manager до начала реализации
- Google Sheets использован вместо PostgreSQL для простоты (можно заменить позже)
- Telegram Bot Token нужно получить через @BotFather
- Meta Business API требует бизнес-аккаунт и review permissions
- KIE.ai API key уже есть, просто добавить в n8n credentials

---

## Проверка доступов перед реализацией

### Уже есть (из предыдущих сессий):
✅ **n8n API Key** — сохранён в Windows Credential Manager via keyring
- Локация: `keyring.get_password('arkhos', 'n8n_api_key')`
- URL: https://n8n.studiokook.ee
- Статус: Работает, подключение проверено

✅ **Telegram Bot**
- Bot Token: `8009187517:AAGBSalSZHGxZtHpw0mShe_8uJ_QByk5igU`
- Chat ID: `804465999`
- Bot Name: `lagedi_bot`
- Локация: `C:\Users\sorte\Desktop\.claude\secrets\telegram.json`

✅ **KIE.ai Account**
- Логин есть
- Депозит есть
- API Key: нужно получить на https://kie.ai/api-key

### Нужно настроить:

⚠️ **OpenAI API Key**
- Получить на https://platform.openai.com/api-keys
- Добавить в n8n credentials (тип: OpenAI API)

⚠️ **Pexels API Key** (опционально, для fallback)
- Бесплатный: https://www.pexels.com/api/
- Добавить в n8n credentials (тип: Header Auth)

⚠️ **Meta Business API** (для Instagram/Facebook)
- Требует Facebook Business Account
- Получить Access Token через Meta for Developers
- Scope: `instagram_basic`, `instagram_content_publish`, `pages_manage_posts`
- Добавить в n8n credentials (тип: OAuth2)

⚠️ **WordPress MCP Endpoint**
- URL: нужно узнать URL WordPress MCP adapter
- Или использовать прямой REST API WordPress

### Чеклист перед началом Фазы 1:

1. ☐ Получить KIE.ai API Key
2. ☐ Получить OpenAI API Key
3. ☐ Получить Pexels API Key (опционально)
4. ☐ Настроить Meta Business API (если хотим автопостинг в Instagram)
5. ☐ Проверить URL WordPress для NextGEN Gallery API
6. ☐ Создать новый Telegram Bot или использовать существующий `lagedi_bot`
7. ☐ Создать Google Sheet "ContentFactory Schedule"

