# Project Routing

## Projects

| Project | Path | Triggers |
|---------|------|----------|
| Studiokook | ~/Desktop/Studiokook | кухни, WordPress, SEO, studiokook.ee, фирма, SMM |
| Personal | ~/Desktop/Personal | личное, задачи, напоминания |

## Routing Logic

Получил запрос → определи проект по триггерам → читай `{path}/CLAUDE.md`

## Project-Specific Skills

| Project | Skills | Triggers |
|---------|--------|----------|
| Studiokook | `claude-wordpress-skills:wp-performance-review` | "performance", "slow site", "timeout", "500 error", "optimization" |
| Studiokook | `skills/wordpress/SKILL.md` | "перевод", "translation", "контент", "страница", "TRP", "SEO", "snippet" |
| Personal | n/a | n/a |

## SEO/Infrastructure Triggers

| Project | Context | Triggers |
|---------|---------|----------|
| Studiokook | `skills/wordpress/projects/studiokook/INFRASTRUCTURE.md` | "robots.txt", "hreflang", "sitemap", "schema", "meta tags", "404" |
| Studiokook | `skills/wordpress/projects/studiokook/SEO-FIXES.md` | "seo fix", "seo audit", "исправить seo" |
