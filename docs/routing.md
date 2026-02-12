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
