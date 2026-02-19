# Pinterest Pinner Workflow - Implementation Checklist

## Pre-Deployment Checklist

### Phase 1: Prepare Credentials (15 mins)

- [ ] **Pinterest API Access**
  - [ ] Create Pinterest Business Account (if needed)
  - [ ] Create App at https://developers.pinterest.com/apps/
  - [ ] Generate permanent access token
  - [ ] Test token with: `curl -H "Authorization: Bearer TOKEN" https://api.pinterest.com/v5/user/account`
  - [ ] Save token to: `credentials/pinterest-api.env`

- [ ] **WordPress REST API**
  - [ ] Verify REST API is enabled on `studiokook.ee`
  - [ ] Create Application Password: WP Admin → Users → Your Account → Application Passwords
  - [ ] Create password named "n8n-pinterest-pinner"
  - [ ] Save credentials to: `credentials/wp_rest_api.json`
  - [ ] Test: `curl -u "USER:PASS" https://studiokook.ee/wp-json/wp/v2/posts?per_page=1`

- [ ] **Telegram Notifications**
  - [ ] Create Telegram bot (@BotFather)
  - [ ] Save bot token to: `credentials/telegram.env`
  - [ ] Create notification channel or group
  - [ ] Get chat ID (use: https://t.me/userinfobot)
  - [ ] Add bot to channel with Admin permissions
  - [ ] Test: Send test message via bot

### Phase 2: Configure Pinterest Boards (20 mins)

- [ ] **Create or Verify 12 Pinterest Boards**
  - [ ] Kitchen Design Ideas
  - [ ] Scandinavian Kitchens
  - [ ] Modern Minimalist Kitchen
  - [ ] Kitchen Materials Guide
  - [ ] BLUM Hardware
  - [ ] Kitchen Lighting
  - [ ] Before & After Kitchens
  - [ ] Kitchen Organization
  - [ ] Custom Kitchen Tallinn
  - [ ] Kitchen FAQ Tips
  - [ ] Neoclassic Kitchens
  - [ ] Loft Style Kitchens

- [ ] **Get Board IDs**
  - [ ] Navigate to each board on Pinterest.com
  - [ ] Board ID is in URL: `pinterest.com/PROFILE/BOARD_ID/`
  - [ ] Copy all 12 board IDs
  - [ ] Update `board_rotation` node with actual IDs

- [ ] **Test Board Access**
  - [ ] Verify all boards are writable (not archived)
  - [ ] Check board descriptions are SEO-optimized

### Phase 3: Configure n8n Workflow (30 mins)

- [ ] **Import Workflow**
  - [ ] n8n Dashboard → "Import Workflow"
  - [ ] Upload: `/sessions/modest-ecstatic-ride/mnt/Studiokook/n8n/dev/pinterest-pinner.json`
  - [ ] Confirm all nodes loaded
  - [ ] Confirm all connections present

- [ ] **Add Credentials**
  - [ ] Click "Create New Credential" for each type
  - [ ] Pinterest API Token (Bearer Token)
    - [ ] Paste token value
    - [ ] Save as "pinterest_token"
  - [ ] WordPress REST API (Basic Auth)
    - [ ] Username from wp_rest_api.json
    - [ ] App password from wp_rest_api.json
    - [ ] Save as "wp_rest_api"
  - [ ] Telegram Bot (String)
    - [ ] Paste bot token
    - [ ] Save as "telegram_bot_token"
  - [ ] Telegram Chat ID (String)
    - [ ] Paste chat ID
    - [ ] Save as "telegram_chat_id"

- [ ] **Update Pinterest Board IDs**
  - [ ] Edit: "Board Rotation & Wave Detection" node
  - [ ] Replace all 12 `board_*` IDs with actual Pinterest board IDs
  - [ ] Test: Execute workflow, check logs for correct board selection

- [ ] **Update Project Library** (Optional - for Wave 2)
  - [ ] Edit: "Wave 2: Select Design Pin from Library" node
  - [ ] Add 16 project entries with:
    - [ ] Unique project IDs
    - [ ] Project names/descriptions
    - [ ] Image URLs (check images exist & are 200 OK)
  - [ ] Test: Verify image URLs load in browser

- [ ] **Update Infographic URLs** (Optional - for Wave 3)
  - [ ] Edit: "Wave 3: Select Design or Infographic" node
  - [ ] Update infographic image URLs
  - [ ] Update design showcase URLs
  - [ ] Verify all images exist

### Phase 4: Testing (45 mins)

- [ ] **Unit Tests: Individual Nodes**
  - [ ] Test "Cron Trigger" → Manual execution
  - [ ] Test "Board Rotation & Wave Detection" → Check output
  - [ ] Test "Wave 1: Get Latest Blog Post" → Should return latest post
  - [ ] Test "Wave 2: Design Pin Selection" → Should select project
  - [ ] Test "Wave 3: Infographic Selection" → Should pick design/infographic
  - [ ] Test "Rate Limiting Check" → Should allow 1st pin
  - [ ] Test "Create Pinterest Pin" → Pin should appear on Pinterest

- [ ] **Integration Tests: Full Workflow**
  - [ ] Execute at 06:00 time
    - [ ] Should create Rich Pin from blog post
    - [ ] Should send Telegram notification
    - [ ] Should log execution
  - [ ] Execute at 12:00 time
    - [ ] Should create Design Pin from project
    - [ ] Should send Telegram notification
  - [ ] Execute at 18:00 time
    - [ ] Should create Infographic or Design pin
    - [ ] Should send Telegram notification
  - [ ] Execute 3x consecutively
    - [ ] First 2: Should succeed
    - [ ] Third: Should succeed
    - [ ] Fourth attempt: Should be blocked, send rate limit notification

- [ ] **Error Handling Tests**
  - [ ] Disable Pinterest credentials → Should error, send Telegram alert
  - [ ] Break WordPress REST API URL → Should handle gracefully
  - [ ] Invalid image URL → Should catch and use fallback
  - [ ] Rate limit exceeded → Should notify via Telegram

- [ ] **Check Telegram Notifications**
  - [ ] Success messages received in real-time
  - [ ] Error messages with execution ID for debugging
  - [ ] Rate limit notifications working

### Phase 5: Deployment to Production (10 mins)

- [ ] **Copy to Production**
  ```bash
  cp /sessions/modest-ecstatic-ride/mnt/Studiokook/n8n/dev/pinterest-pinner.json \
     /sessions/modest-ecstatic-ride/mnt/Studiokook/n8n/prod/pinterest-pinner.json
  ```

- [ ] **Enable in n8n**
  - [ ] n8n Dashboard → Workflows → "Pinterest Pinner"
  - [ ] Toggle "Active" to ON
  - [ ] Verify "Save" is successful
  - [ ] Check cron is scheduled in n8n

- [ ] **Setup Monitoring**
  - [ ] Add to monitoring dashboard
  - [ ] Set up alerts for failed executions
  - [ ] Check logs daily for first week

### Phase 6: Post-Deployment (Ongoing)

**Week 1: Daily Monitoring**
- [ ] Check Telegram notifications every morning
- [ ] Verify pins appear on Pinterest
- [ ] Monitor n8n execution logs
- [ ] Track pin engagement (saves, clicks)

**Week 2-4: Regular Checks**
- [ ] Verify board rotation is working (new board each day)
- [ ] Check Wave 1/2/3 content is varying
- [ ] Monitor rate limiting (should see ~3 pins/day)
- [ ] Update pin descriptions based on engagement

**Month 2+: Optimization**
- [ ] Review which boards get most saves
- [ ] Identify high-performing pin types
- [ ] Update images for low-performing pins
- [ ] Consider A/B testing descriptions
- [ ] Plan content calendar

---

## Quick Reference: Manual Test Commands

### Test Pinterest Board Fetch
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.pinterest.com/v5/boards
```

### Test WordPress REST API
```bash
curl -u "WP_USER:WP_APP_PASS" \
  "https://studiokook.ee/wp-json/wp/v2/posts?per_page=1&orderby=date"
```

### Test Telegram Notification
```bash
curl -X POST "https://api.telegram.org/botYOUR_TOKEN/sendMessage" \
  -d "chat_id=YOUR_CHAT_ID" \
  -d "text=Test message from Pinterest Pinner" \
  -d "parse_mode=HTML"
```

### Create Pinterest Pin (Manual)
```bash
curl -X POST "https://api.pinterest.com/v5/pins" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "board_id": "YOUR_BOARD_ID",
    "title": "Test Pin",
    "description": "Testing Pinterest API",
    "link": "https://studiokook.ee",
    "media_source": {
      "source_type": "image_url",
      "url": "https://studiokook.ee/image.jpg"
    }
  }'
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Workflow doesn't execute at scheduled time | Cron not activated | Toggle "Active" to ON in workflow settings |
| Pinterest API 401 errors | Invalid/expired token | Regenerate token, update credentials |
| No blog posts found | WordPress REST API down | Check studiokook.ee/wp-json/wp/v2/posts |
| Images not showing on pins | Image URLs 404 | Update image URLs to valid paths |
| Telegram not notifying | Wrong bot token or chat ID | Verify credentials with @userinfobot |
| Rate limit blocking all pins | PINS_TODAY env var not reset | Set PINS_TODAY=0 daily (add separate workflow) |
| Duplicate pins on same board | Board rotation failing | Check board_rotation node is calculating index correctly |

---

## Files Created

✓ `/sessions/modest-ecstatic-ride/mnt/Studiokook/n8n/dev/pinterest-pinner.json`
✓ `/sessions/modest-ecstatic-ride/mnt/Studiokook/n8n/dev/PINTEREST_PINNER_SETUP.md`
✓ `/sessions/modest-ecstatic-ride/mnt/Studiokook/n8n/dev/IMPLEMENTATION_CHECKLIST.md` (this file)

---

## Estimated Timeline

- **Total Setup Time**: 2-3 hours
- **Testing Time**: 1-2 hours
- **First 30 Days Monitoring**: 10-15 mins/day

## Support Contacts

- **n8n Docs**: https://docs.n8n.io/
- **Pinterest API Docs**: https://developers.pinterest.com/docs/api/overview/
- **Studiokook Team**: Internal support channel

---

**Workflow Status**: Ready for Deployment ✓
**Last Updated**: 2026-02-14
**Version**: 2.0 Production-Ready
