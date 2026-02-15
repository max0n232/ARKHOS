"""SEO audit agent for studiokook.ee using Claude API."""

import anthropic
import httpx
from bs4 import BeautifulSoup
from dataclasses import dataclass


@dataclass
class SEOAudit:
    url: str
    score: int  # 0-100
    issues: list[dict]
    recommendations: list[str]
    meta: dict


async def fetch_page(url: str) -> str:
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.text


def extract_seo_data(html: str, url: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")

    title = soup.find("title")
    meta_desc = soup.find("meta", attrs={"name": "description"})
    h1_tags = soup.find_all("h1")
    h2_tags = soup.find_all("h2")
    images = soup.find_all("img")
    images_no_alt = [img for img in images if not img.get("alt")]
    canonical = soup.find("link", attrs={"rel": "canonical"})
    og_title = soup.find("meta", attrs={"property": "og:title"})
    og_desc = soup.find("meta", attrs={"property": "og:description"})
    schema_scripts = soup.find_all("script", attrs={"type": "application/ld+json"})

    return {
        "url": url,
        "title": title.text.strip() if title else None,
        "title_length": len(title.text.strip()) if title else 0,
        "meta_description": meta_desc["content"].strip() if meta_desc and meta_desc.get("content") else None,
        "meta_description_length": len(meta_desc["content"].strip()) if meta_desc and meta_desc.get("content") else 0,
        "h1_count": len(h1_tags),
        "h1_texts": [h.text.strip() for h in h1_tags],
        "h2_count": len(h2_tags),
        "h2_texts": [h.text.strip() for h in h2_tags[:10]],
        "images_total": len(images),
        "images_no_alt": len(images_no_alt),
        "has_canonical": canonical is not None,
        "canonical_url": canonical["href"] if canonical else None,
        "has_og_tags": og_title is not None,
        "og_title": og_title["content"] if og_title and og_title.get("content") else None,
        "og_description": og_desc["content"] if og_desc and og_desc.get("content") else None,
        "has_schema": len(schema_scripts) > 0,
        "schema_count": len(schema_scripts),
    }


AUDIT_PROMPT = """You are an SEO expert analyzing a page for studiokook.ee (custom kitchen furniture, Tallinn, Estonia).
Target audience: homeowners 30-55, renovation projects.
Primary keywords (Estonian): köögimööbel, köök tellimustöö, eritellimusköök, köögidisain, köögimööbel tallinn.

Analyze this page data and return a JSON object with exactly this structure:
{
  "score": <0-100>,
  "issues": [
    {"severity": "critical|warning|info", "category": "title|meta|headings|images|schema|content|technical", "message": "..."}
  ],
  "recommendations": ["actionable recommendation 1", "..."]
}

Rules:
- Score 90-100: excellent, 70-89: good, 50-69: needs work, <50: poor
- Max 10 issues, max 5 recommendations
- Focus on Estonian market specifics
- Be specific and actionable

Page data:
"""


async def audit_page(url: str, api_key: str) -> SEOAudit:
    html = await fetch_page(url)
    seo_data = extract_seo_data(html, url)

    client = anthropic.AsyncAnthropic(api_key=api_key)
    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": AUDIT_PROMPT + str(seo_data),
        }],
    )

    import json
    response_text = message.content[0].text
    # Extract JSON from response (Claude may wrap in markdown)
    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0]
    elif "```" in response_text:
        response_text = response_text.split("```")[1].split("```")[0]

    result = json.loads(response_text.strip())

    return SEOAudit(
        url=url,
        score=result["score"],
        issues=result["issues"],
        recommendations=result["recommendations"],
        meta=seo_data,
    )
