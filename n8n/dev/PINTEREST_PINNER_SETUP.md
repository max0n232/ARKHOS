# Pinterest Pinner Workflow - Complete Setup Guide

**File**: `pinterest-pinner.json`
**Status**: Production-Ready
**Version**: 2.0 (2026-02-14)
**Timezone**: Europe/Tallinn

## Overview

Complete n8n workflow for automated Pinterest pin creation with:
- 3x daily execution (06:00, 12:00, 18:00 Tallinn time)
- 12-board rotation system
- 3-wave content strategy (Rich Pins, Design Pins, Infographics)
- Rate limiting (max 3 pins/day)
- Bilingual support (EN + ET)
- Telegram notifications for success & errors
- Complete audit logging

## Workflow Nodes (15 total)

### 1. **Cron Trigger** (cron_trigger)
- **Type**: Cron Scheduler
- **Schedule**: 06:00, 12:00, 18:00 Europe/Tallinn
- **Output**: Initiates workflow 3x daily

### 2. **Board Rotation & Wave Detection** (board_rotation)
- **Type**: Code Node
- **Logic**:
  - Rotates through 12 boards (cycles daily)
  - Detects wave based on execution time (1/2/3)
  - Returns selected board & wave number
- **Output**:
  ```json
  {
    "selectedBoard": { "id": "board_*", "name": "..." },
    "boardIndex": 0-11,
    "wave": 1|2|3,
    "totalBoards": 12
  }
  ```

### 3. **Wave 1: Get Latest Blog Post** (fetch_latest_post)
- **Type**: HTTP Request
- **Endpoint**: `https://studiokook.ee/wp-json/wp/v2/posts`
- **Auth**: WordPress REST API (Basic Auth)
- **Params**: `per_page=1&orderby=date&order=desc`
- **When**: Executes every 6 hours (uses Wave 1 data at 06:00)

### 4. **Extract Blog Post Data** (extract_blog_data)
- **Type**: Code Node
- **Processes**:
  - Extracts title, excerpt, featured image
  - Generates Rich Pin description
  - Creates engagement-focused copy
- **Output**:
  ```json
  {
    "pinType": "rich_pin",
    "title": "Blog Post Title",
    "description": "...",
    "url": "blog post link",
    "imageUrl": "featured image URL",
    "postId": 12345
  }
  ```

### 5. **Wave 2: Select Design Pin from Library** (wave2_design_pin)
- **Type**: Code Node
- **Library**: 16 project folders
- **Rotation**: Cycles every 6 hours
- **Projects**:
  - Modern Kitchen 1-3
  - Scandinavian Kitchen
  - Classic Design
  - Minimalist Space
  - Luxury Kitchen
  - And 9 more themed projects
- **Output**:
  ```json
  {
    "pinType": "design_pin",
    "projectFolder": { "id": "proj_*", "name": "..." },
    "title": "Project Name | Custom Kitchen by Studiokook",
    "description": "Design description + call to action",
    "url": "https://studiokook.ee/portfolio",
    "imageUrl": "project featured image"
  }
  ```

### 6. **Wave 3: Select Design or Infographic** (wave3_design_infographic)
- **Type**: Code Node
- **Logic**: Alternates daily (even/odd day)
- **Even Days**: Infographic pins (tips, trends, guides)
- **Odd Days**: Portfolio showcase pins
- **Output**:
  ```json
  {
    "pinType": "infographic|design_showcase",
    "title": "Infographic/Design Title",
    "description": "Trend-focused or portfolio description",
    "url": "https://studiokook.ee/...",
    "imageUrl": "infographic or portfolio image URL"
  }
  ```

### 7. **Rate Limiting Check** (rate_limiting)
- **Type**: Code Node
- **Logic**:
  - Reads `PINS_TODAY` environment variable
  - Enforces 3 pins maximum per day
  - Returns allowed/denied status
- **Output**:
  ```json
  {
    "allowed": true|false,
    "pinsCreatedToday": 0-3,
    "pinsRemaining": 0-3,
    "reason": "Approved|Daily limit reached"
  }
  ```

### 8. **Check Rate Limit Passed** (check_rate_limit)
- **Type**: IF Node (decision gate)
- **Condition**: `allowed === true`
- **True Path**: Create pin → Log → Notify
- **False Path**: Rate limit notification

### 9. **Merge Content Data** (merge_content)
- **Type**: Code Node
- **Logic**:
  - Combines all content sources based on wave
  - Standardizes data format for pin creation
  - Selects appropriate description & image
- **Output**: Unified content object ready for API

### 10. **Create Pinterest Pin** (create_pin)
- **Type**: HTTP Request (POST)
- **Endpoint**: `https://api.pinterest.com/v5/pins`
- **Auth**: Bearer Token (Pinterest API)
- **Payload**:
  ```json
  {
    "board_id": "string",
    "title": "string",
    "description": "string with emojis & formatting",
    "link": "https://studiokook.ee/...",
    "media_source": {
      "source_type": "image_url",
      "url": "image URL"
    }
  }
  ```
- **Response**: Pin object with ID

### 11. **Log Pin Creation** (log_success)
- **Type**: Code Node
- **Extracts**:
  - Pin ID from response
  - Board name & ID
  - Pin type (rich, design, infographic)
  - Timestamp & execution ID
- **Output**:
  ```json
  {
    "status": "success",
    "pinId": "...",
    "boardId": "...",
    "boardName": "...",
    "pinType": "rich_pin|design_pin|infographic",
    "wave": 1|2|3,
    "timestamp": "2026-02-14T18:00:00.000Z"
  }
  ```

### 12. **Success Notification (Telegram)** (notify_telegram)
- **Type**: HTTP Request (POST)
- **Endpoint**: `https://api.telegram.org/bot{TOKEN}/sendMessage`
- **Format**: HTML with emoji
- **Example**:
  ```
  ✅ Pinterest Pin Created

  📌 Kitchen Design Trends 2026
  🎯 Board: Modern Minimalist Kitchen
  🌊 Wave 2
  ⏰ 2026-02-14T12:00:00Z
  ```

### 13. **Store Success Log** (store_log)
- **Type**: Code Node
- **Creates**: Structured audit log entry
- **Fields**:
  - Timestamp
  - Execution ID
  - Workflow name
  - Wave number
  - Board metadata
  - Pin metadata
- **Output**: Sent to console/logging service

### 14. **Rate Limit Notification** (notify_limit)
- **Type**: HTTP Request (Telegram)
- **Triggered**: When rate limit exceeded
- **Message**: Displays remaining pins for day

### 15. **Error Notification (Telegram)** (notify_error)
- **Type**: HTTP Request (Telegram) - Global Error Handler
- **Triggered**: On workflow error
- **Message**: Error details + execution ID for debugging

## 12 Pinterest Boards

1. **Kitchen Design Ideas** - General inspiration & design concepts
2. **Scandinavian Kitchens** - Light, minimal Nordic style
3. **Modern Minimalist Kitchen** - Contemporary clean design
4. **Kitchen Materials Guide** - Surfaces, finishes, materials
5. **BLUM Hardware** - Innovative kitchen hardware & solutions
6. **Kitchen Lighting** - Lighting design & fixtures
7. **Before & After Kitchens** - Renovation transformations
8. **Kitchen Organization** - Storage & organization solutions
9. **Custom Kitchen Tallinn** - Local Studiokook projects
10. **Kitchen FAQ Tips** - Practical tips & frequently asked questions
11. **Neoclassic Kitchens** - Classical elegant style
12. **Loft Style Kitchens** - Industrial & urban designs

**Rotation Strategy**: Cycles daily (board changes every 24 hours), no repeats within 12-day cycle.

## Content Wave Strategy

### Wave 1 (06:00) - Rich Pins from Blog
- **Source**: Latest WordPress blog post
- **Type**: Rich Pin (includes recipe/article metadata)
- **Content**: Blog title + excerpt + link
- **Frequency**: Every 3 executions (can hit same board multiple times)
- **Best For**: SEO & click-through engagement

### Wave 2 (12:00) - Design Pins from Portfolio
- **Source**: 16-project rotation library
- **Type**: Design Pin (project showcase)
- **Content**: Project name + description + portfolio link
- **Frequency**: Every 3 executions
- **Best For**: Portfolio visibility & project discovery

### Wave 3 (18:00) - Design or Infographic
- **Source**: Mixed (alternates daily)
- **Type**: Infographic or Design showcase
- **Content**: Trends, tips, or featured projects
- **Frequency**: Every 3 executions
- **Best For**: Thought leadership & trend visibility

## Rate Limiting

**Max 3 pins per day** across all waves:
- 06:00 trigger: Potential pin #1
- 12:00 trigger: Potential pin #2
- 18:00 trigger: Potential pin #3
- Beyond: Blocked with Telegram notification

**Purpose**: Avoid Pinterest spam filters while maintaining consistent presence.

## Credentials Required

### 1. Pinterest API Token
- **Name**: `pinterest_token`
- **Type**: Bearer Token
- **Location**: `credentials/pinterest-api.env`
- **Format**: `Bearer YOUR_PINTEREST_ACCESS_TOKEN_HERE`
- **Setup**: Get from Pinterest Developer Portal

### 2. WordPress REST API
- **Name**: `wp_rest_api`
- **Type**: HTTP Basic Auth
- **Location**: `credentials/wp_rest_api.json`
- **Variables**: `$WP_USER`, `$WP_APP_PASS`
- **Endpoint**: `https://studiokook.ee/wp-json/`

### 3. Telegram Bot Token
- **Name**: `telegram_bot_token`
- **Type**: String
- **Format**: `123456789:ABCDefGHIjklmNOpqrsTUVwxyzABCD`

### 4. Telegram Chat ID
- **Name**: `telegram_chat_id`
- **Type**: String
- **Format**: `-1001234567890` (group) or `987654321` (user)

## Setup Instructions

### Step 1: Import Workflow
1. Go to n8n: `https://n8n.studiokook.ee`
2. Click "Import Workflow"
3. Upload `pinterest-pinner.json`
4. Confirm node connections (should auto-link)

### Step 2: Configure Credentials
1. For each credential type, click "Create New"
2. Pinterest API:
   - Type: Bearer Token
   - Token: Paste your Pinterest API token
3. WordPress REST API:
   - Type: Basic Auth
   - Username: `$WP_USER` value
   - Password: `$WP_APP_PASS` value
4. Telegram Credentials:
   - Bot Token: Your bot's token
   - Chat ID: Your notification channel ID

### Step 3: Customize Board IDs
- Edit `board_rotation` node
- Replace placeholder board IDs (`board_*`) with actual Pinterest board IDs
- Find board IDs in Pinterest URL: `https://pinterest.com/USERPROFILE/BOARDNAME/`

### Step 4: Customize Project Folders
- Edit `wave2_design_pin` node
- Replace project IDs (`proj_*`) with actual image URLs or folder references
- Update project names & descriptions to match your portfolio

### Step 5: Test Locally
```bash
# In n8n:
1. Click "Execute Workflow" button
2. Check Telegram for notification
3. Verify pin created on Pinterest
4. Check n8n execution logs for any errors
```

### Step 6: Deploy to Production
```bash
cp /sessions/modest-ecstatic-ride/mnt/Studiokook/n8n/dev/pinterest-pinner.json \
   /sessions/modest-ecstatic-ride/mnt/Studiokook/n8n/prod/pinterest-pinner.json

# Then in n8n:
1. Set "Active" toggle to ON
2. Cron will trigger at 06:00, 12:00, 18:00 Tallinn time
```

## Environment Variables

Set these in your n8n environment or workflow settings:

```bash
PINS_TODAY=0              # Reset daily (via cron or external script)
WP_USER=your_wp_user      # From credentials/wp_rest_api.json
WP_APP_PASS=your_app_pass # From credentials/wp_rest_api.json
BOARD_INDEX=0             # Current board index (optional)
PROJECT_INDEX=0           # Current project index (optional)
```

## Monitoring & Debugging

### Check Workflow Executions
1. n8n Dashboard → Workflow → "Executions" tab
2. Filter by status: Success/Error/Skipped

### Monitor Pins Created
1. Check Telegram notifications in real-time
2. View execution logs for detailed data flow
3. Check Pinterest account for published pins

### Common Issues

| Issue | Solution |
|-------|----------|
| Pinterest API 401 | Verify token in credentials, ensure not expired |
| No pins created | Check rate_limiting node, may have hit 3/day limit |
| Telegram not notifying | Verify bot token & chat ID in credentials |
| Blog post fetch fails | Verify WordPress REST API is enabled & credentials correct |
| Images not showing | Verify image URLs are publicly accessible, not 404 |

## Enhancement Ideas for Future

1. **Database Integration**: Store all pins in SQLite (knowledge/) for reporting
2. **AI Image Generation**: Use OpenAI/Midjourney for custom design images
3. **SEO Keywords**: Auto-extract & include relevant keywords in descriptions
4. **Schedule Flexibility**: Add day-of-week triggers for special content
5. **Analytics Dashboard**: Track pin performance metrics (clicks, saves)
6. **Multi-language**: Add RU pins for Russian audience (existing /ru/ content)
7. **Link Variations**: A/B test different CTAs & landing pages
8. **Video Pins**: Extend to support short video content (max 15sec)

## File Structure

```
n8n/
├── dev/
│   ├── pinterest-pinner.json          ← This workflow (dev version)
│   ├── PINTEREST_PINNER_SETUP.md      ← This documentation
│   ├── content-generator.json          ← Related: Content creation
│   └── seo-content-translator.json     ← Related: Translation workflow
├── prod/
│   └── pinterest-pinner.json           ← Production deployment
└── workflows/
    └── [other historical workflows]
```

## Support & Maintenance

**Created**: 2026-02-14
**Last Updated**: 2026-02-14
**Maintainer**: Studiokook automation
**Status**: Active & monitored

For issues or updates:
1. Check execution logs in n8n
2. Review Telegram notifications
3. Update this documentation
4. Test changes in `/dev/` before deploying to `/prod/`

---

**Pinterest API Docs**: https://developers.pinterest.com/docs/api/overview/
**n8n Docs**: https://docs.n8n.io/
**Studiokook Site**: https://studiokook.ee/
