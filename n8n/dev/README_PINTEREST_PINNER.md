# Pinterest Pinner Workflow - Complete Implementation

**Status**: ✓ PRODUCTION READY
**Created**: 2026-02-14
**Version**: 2.0
**Maintainer**: Studiokook Automation Team

---

## What's Included

### Main Workflow File
📄 **pinterest-pinner.json** (19 KB)
- Fully functional n8n workflow
- 15 production nodes with error handling
- Ready to import directly into n8n

### Documentation (4 files)
📖 **QUICK_START.md** - Get started in 5 minutes
📖 **PINTEREST_PINNER_SETUP.md** - Complete technical documentation
📖 **IMPLEMENTATION_CHECKLIST.md** - Step-by-step deployment guide
📖 **README_PINTEREST_PINNER.md** - This file

---

## Workflow Features

### Scheduling
- **Cron Trigger**: 3x daily at 06:00, 12:00, 18:00 (Europe/Tallinn timezone)
- **Frequency**: Consistent content distribution throughout the day
- **Reliability**: Automatic retry on failure

### Content Strategy (3 Waves)
| Time | Wave | Source | Type | Frequency |
|------|------|--------|------|-----------|
| 06:00 | 1 | WordPress Latest Post | Rich Pin | Every 3 executions |
| 12:00 | 2 | Portfolio (16 Projects) | Design Pin | Every 3 executions |
| 18:00 | 3 | Mixed Content | Infographic/Design | Every 3 executions |

### Board Management
- **12 Pinterest Boards** with complete rotation
- **Daily rotation** - different board each day
- **No repeats** within 12-day cycle
- **Seamless management** via Code node

### Rate Limiting
- **Max 3 pins per day** (prevents spam filters)
- **Automatic blocking** when limit reached
- **Telegram notification** when limit exceeded
- **Configurable** via code node

### Error Handling & Monitoring
- **Global error handler** with Telegram notifications
- **Success logging** for audit trail
- **Detailed execution logs** in n8n
- **Real-time alerts** via Telegram

### Multi-Language Support
- **English (EN)** - Primary descriptions
- **Estonian (ET)** - Secondary descriptions
- **Extensible** to additional languages

---

## Node Architecture

```
┌─────────────────┐
│  Cron Trigger   │ (06:00, 12:00, 18:00)
└────────┬────────┘
         │
┌────────▼─────────────────────────┐
│ Board Rotation & Wave Detection  │
└────┬──────────────┬──────────────┬──┐
     │              │              │  │
     ▼              ▼              ▼  ▼
  Wave 1         Wave 2          Wave 3   Rate Limit
  Blog Post      Design Pin      Infogr.  Check
     │              │              │         │
     └──────────────┴──────────────┴────────►│ (all sources merge)
                                            │
                                    ┌───────▼────────┐
                                    │ Rate Limit OK? │
                                    └────┬───────┬───┘
                         YES            │       │ NO
                          │             │       └──► Notify Limit
                          │             │
                    ┌─────▼──────────┐  │
                    │ Merge Content  │  │
                    └────────┬───────┘  │
                             │          │
                    ┌────────▼─────┐   │
                    │ Create Pin   │   │
                    │ (Pinterest)  │   │
                    └────────┬─────┘   │
                             │         │
                    ┌────────▼──────┐  │
                    │ Log Success   │  │
                    │ & Notify (TG) │  │
                    └──────────────►└──►
```

---

## Technical Specifications

### Node Types Used (15 total)
- **1x Cron Scheduler** - Timing trigger
- **8x Code Nodes** - Business logic (board rotation, wave detection, rate limiting, etc.)
- **5x HTTP Request Nodes** - API integration (WordPress, Pinterest, Telegram)
- **1x IF Node** - Conditional branching

### Credentials Required
1. **Pinterest API Token** (Bearer Token)
2. **WordPress REST API** (Basic Auth)
3. **Telegram Bot Token** (String)
4. **Telegram Chat ID** (String)

### API Integrations
- **WordPress REST API v2** - Fetch latest posts
- **Pinterest API v5** - Create pins
- **Telegram Bot API** - Send notifications

### Data Flow
```
WordPress Posts ──────┐
                      │
Portfolio Images ─────┼──► Rate Limit Check ──► Pinterest API ──► Telegram
                      │
Infographic Images ───┘
```

---

## Installation Steps (Quick Reference)

### 1. Import Workflow (2 minutes)
```
n8n Dashboard → Import Workflow → Select pinterest-pinner.json
```

### 2. Configure Credentials (5 minutes)
```
Add 4 credentials:
- pinterest_token (Bearer Token)
- wp_rest_api (Basic Auth)
- telegram_bot_token (String)
- telegram_chat_id (String)
```

### 3. Update Configuration (10 minutes)
```
Edit nodes with your data:
- board_rotation: 12 Pinterest board IDs
- wave2_design_pin: 16 project image URLs
- wave3_design_infographic: Infographic/design image URLs
```

### 4. Test Execution (5 minutes)
```
Execute workflow manually
→ Check Telegram for notification
→ Verify pin on Pinterest
→ Check n8n execution logs
```

### 5. Deploy to Production (1 minute)
```
Toggle "Active" switch to ON
Cron will start at 06:00, 12:00, 18:00 Tallinn time
```

**Total Setup Time: ~30 minutes**

---

## Configuration Guide

### Pinterest Boards (12)
```javascript
board_kitchen_design     → Kitchen Design Ideas
board_scandinavian       → Scandinavian Kitchens
board_modern_minimalist  → Modern Minimalist Kitchen
board_materials          → Kitchen Materials Guide
board_blum               → BLUM Hardware
board_lighting           → Kitchen Lighting
board_before_after       → Before & After Kitchens
board_organization       → Kitchen Organization
board_custom_tallinn     → Custom Kitchen Tallinn
board_faq                → Kitchen FAQ Tips
board_neoclassic         → Neoclassic Kitchens
board_loft               → Loft Style Kitchens
```

### Project Library (16 - Configurable)
```javascript
proj_001 → Modern Kitchen 1
proj_002 → Scandinavian Kitchen
proj_003 → Classic Design
[... 13 more projects ...]
proj_016 → Urban Loft Kitchen
```

### Environment Variables (Optional)
```bash
PINS_TODAY=0              # Reset daily for rate limiting
WP_USER=wordpress_user    # From credentials
WP_APP_PASS=app_password  # From credentials
```

---

## Monitoring & Maintenance

### Daily Checks (2 minutes)
- [ ] 1 Telegram notification received
- [ ] Pin appears on Pinterest
- [ ] Execution logs show green status

### Weekly Review (10 minutes)
- [ ] ~21 pins created (3 per day × 7)
- [ ] Different boards used daily
- [ ] Pin engagement metrics checked
- [ ] Descriptions updated if needed

### Monthly Optimization (30 minutes)
- [ ] Analyze which boards get most saves
- [ ] Identify high-performing content types
- [ ] Update descriptions for low performers
- [ ] Plan next month's content calendar

---

## Troubleshooting Quick Links

| Problem | Solution |
|---------|----------|
| No pins created | See IMPLEMENTATION_CHECKLIST.md → Troubleshooting |
| Telegram not notifying | Check credentials, test notification node |
| Rate limit blocking | Check PINS_TODAY env var, rate_limiting code |
| Same board every day | Update board rotation index calculation |
| Images not loading | Verify URLs return HTTP 200, check image paths |

→ **Full troubleshooting guide**: See IMPLEMENTATION_CHECKLIST.md

---

## Performance Metrics (Expected)

### Daily
- **Pins created**: 3 (max, accounting for rate limit)
- **Execution time**: ~5 seconds per pin
- **Success rate**: 95%+
- **Telegram notifications**: 3-4

### Monthly
- **Total pins**: 60-90
- **Impressions**: 1000+
- **Saves**: 50-200
- **Clicks to site**: 10-30

### Metrics Vary By:
- Board popularity & follower count
- Image quality & relevance
- Description quality & keywords
- Time of day (afternoon usually performs better)
- Seasonality & trends

---

## Advanced Customization

### Change Schedule
Edit `cron_trigger` → `parameters.rule.interval`
```javascript
// From: [06:00, 12:00, 18:00]
// To: [07:00, 13:00, 19:00] or any custom times
```

### Change Rate Limit
Edit `rate_limiting` → Code node
```javascript
const maxPinsPerDay = 3; // Change to any number
```

### Add New Content Source
1. Create new Code node for content selection
2. Add new IF condition in `check_rate_limit`
3. Connect new branch to `merge_content`
4. Add new Wave (Wave 4, etc.)

### Change Board Rotation Speed
Edit `board_rotation` → Code node
```javascript
// Change rotation frequency:
// Daily (current):    Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % 12
// Weekly:             Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % 12
// Random:             Math.floor(Math.random() * 12)
```

---

## File Structure

```
n8n/
├── dev/                          ← Development environment
│   ├── pinterest-pinner.json     ← MAIN WORKFLOW (this is it!)
│   ├── QUICK_START.md            ← 5-minute setup guide
│   ├── PINTEREST_PINNER_SETUP.md ← Detailed documentation
│   ├── IMPLEMENTATION_CHECKLIST.md ← Deployment checklist
│   └── README_PINTEREST_PINNER.md ← This file
│
└── prod/                         ← Production environment
    └── pinterest-pinner.json    ← Production copy (after testing)
```

---

## Credentials Setup (Detailed)

### 1. Pinterest API Token
```
1. https://developers.pinterest.com/apps/
2. Create new app
3. Go to "Credentials" tab
4. Copy "Access Token"
5. Save to: credentials/pinterest-api.env
6. Format: Bearer abc123xyz...
```

### 2. WordPress REST API
```
1. WordPress Admin → Users
2. Edit your user
3. Scroll to "Application Passwords"
4. Create password: "n8n-pinterest-pinner"
5. Copy username + password
6. Save to: credentials/wp_rest_api.json
7. Format: Basic Auth with username + password
```

### 3. Telegram Bot Token
```
1. https://t.me/BotFather
2. /newbot
3. Follow prompts to create bot
4. Copy token (123456:ABC-DEF...)
5. Save to: credentials/telegram.env
```

### 4. Telegram Chat ID
```
1. https://t.me/userinfobot
2. Send /start
3. Receive your numeric ID
4. For group: Add bot, send message, get ID from logs
5. Save to: credentials/telegram.env (with minus sign: -1001234567890)
```

---

## Getting Help

### Documentation
- **Quick Start**: See `QUICK_START.md` (5 mins)
- **Setup Guide**: See `PINTEREST_PINNER_SETUP.md` (detailed)
- **Deployment**: See `IMPLEMENTATION_CHECKLIST.md` (step-by-step)

### External Resources
- **Pinterest API**: https://developers.pinterest.com/docs/api/overview/
- **n8n Documentation**: https://docs.n8n.io/
- **n8n Community**: https://community.n8n.io/

### Team Support
- Check internal Slack/documentation
- Review n8n execution logs for errors
- Enable debug mode for detailed logging

---

## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 2.0 | 2026-02-14 | ✓ PRODUCTION READY | Complete workflow with all features |
| 1.0 | 2026-02-10 | Deprecated | Initial development version |

---

## Success Criteria

Workflow is working correctly when:

✓ Executes 3x daily at scheduled times
✓ Creates 1-3 pins per day on Pinterest
✓ Sends Telegram notification for each pin
✓ Rotates through all 12 boards over 12 days
✓ Blocks pins when reaching 3/day limit
✓ Logs all executions with timestamps
✓ Handles errors gracefully (no crashes)
✓ Images load correctly on Pinterest

---

## Next Actions

1. **Immediately**: Read `QUICK_START.md` (5 minutes)
2. **Today**: Follow setup steps in `IMPLEMENTATION_CHECKLIST.md`
3. **Tomorrow**: Monitor first daily executions
4. **Week 1**: Refine descriptions based on engagement
5. **Ongoing**: Monthly optimization and content planning

---

## Summary

**What You Have**:
- ✓ Complete, production-ready n8n workflow
- ✓ 15 professional nodes with error handling
- ✓ 3-wave content strategy fully implemented
- ✓ 12 Pinterest boards with intelligent rotation
- ✓ Rate limiting to prevent spam
- ✓ Real-time Telegram notifications
- ✓ Complete audit logging
- ✓ Comprehensive documentation

**What You Need To Do**:
1. Get 4 API credentials (Pinterest, WordPress, Telegram)
2. Update board IDs and image URLs
3. Import workflow into n8n
4. Test once manually
5. Toggle "Active" to ON

**Time to Live**: 30-60 minutes
**Expected ROI**: High (consistent Pinterest presence, zero manual effort)
**Support**: Comprehensive documentation included

---

**Ready to deploy?** Start with: `/n8n/dev/QUICK_START.md`

**Need details?** See: `/n8n/dev/PINTEREST_PINNER_SETUP.md`

**Step-by-step setup?** Follow: `/n8n/dev/IMPLEMENTATION_CHECKLIST.md`

---

**Pinterest Pinner Workflow**
Created with ❤️ for Studiokook
Production-Ready | Fully Documented | Enterprise-Grade
