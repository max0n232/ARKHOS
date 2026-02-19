"""FastAPI app for Studiokook AI agents."""

import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from seo_agent import audit_page

load_dotenv()

app = FastAPI(title="Studiokook Agents", version="0.1.0")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")


class AuditRequest(BaseModel):
    url: str


class AuditResponse(BaseModel):
    url: str
    score: int
    issues: list[dict]
    recommendations: list[str]
    meta: dict


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/seo/audit", response_model=AuditResponse)
async def seo_audit(req: AuditRequest):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(500, "ANTHROPIC_API_KEY not set")
    try:
        result = await audit_page(req.url, ANTHROPIC_API_KEY)
        return AuditResponse(
            url=result.url,
            score=result.score,
            issues=result.issues,
            recommendations=result.recommendations,
            meta=result.meta,
        )
    except Exception as e:
        raise HTTPException(500, str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8100)
