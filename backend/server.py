"""KRINTERIOR AI – Smart Interior Studio backend."""
import base64
import json
import logging
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

import jwt
from dotenv import load_dotenv
from emergentintegrations.llm.chat import ImageContent, LlmChat, UserMessage
from fastapi import APIRouter, Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "10080"))

GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image-preview"
GEMINI_TEXT_MODEL = "gemini-2.5-flash"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
users_col = db["users"]
projects_col = db["projects"]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("krinterior")

app = FastAPI(title="KRINTERIOR AI")
api = APIRouter(prefix="/api")


# ---------- helpers ----------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": now_utc() + timedelta(minutes=JWT_EXPIRE_MINUTES),
        "iat": now_utc(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await users_col.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------- models ----------
class SignupIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    email: EmailStr
    token: str
    new_password: str = Field(min_length=6, max_length=128)


class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UpdateProfileIn(BaseModel):
    full_name: Optional[str] = None


class GenerateDesignIn(BaseModel):
    image_base64: str  # raw base64 (no data url prefix)
    room_type: str
    budget: int
    color_palette: str
    requirements: Optional[str] = ""


class SaveProjectIn(BaseModel):
    name: str
    original_image: str  # base64
    generated_image: str  # base64
    room_type: str
    budget: int
    color_palette: str
    requirements: Optional[str] = ""
    furniture_estimate: list
    total_cost: int
    vastu_score: int
    vastu_report: dict
    space_analysis: dict


class RenameProjectIn(BaseModel):
    name: str


# ---------- auth ----------
@api.post("/auth/signup", response_model=AuthOut)
async def signup(body: SignupIn):
    email = body.email.lower()
    existing = await users_col.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": email,
        "full_name": body.full_name or email.split("@")[0],
        "password_hash": pwd_context.hash(body.password),
        "created_at": now_utc().isoformat(),
    }
    await users_col.insert_one(doc)
    public = {
        "id": user_id,
        "email": email,
        "full_name": doc["full_name"],
        "created_at": doc["created_at"],
    }
    return AuthOut(access_token=create_token(user_id), user=public)


@api.post("/auth/login", response_model=AuthOut)
async def login(body: LoginIn):
    email = body.email.lower()
    user = await users_col.find_one({"email": email})
    if not user or not pwd_context.verify(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    public = {
        "id": user["id"],
        "email": user["email"],
        "full_name": user.get("full_name"),
        "created_at": user.get("created_at"),
    }
    return AuthOut(access_token=create_token(user["id"]), user=public)


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api.put("/auth/me")
async def update_me(body: UpdateProfileIn, user: dict = Depends(get_current_user)):
    update = {}
    if body.full_name is not None:
        update["full_name"] = body.full_name
    if update:
        await users_col.update_one({"id": user["id"]}, {"$set": update})
    fresh = await users_col.find_one(
        {"id": user["id"]}, {"_id": 0, "password_hash": 0}
    )
    return fresh


@api.post("/auth/forgot-password")
async def forgot_password(body: ForgotPasswordIn):
    """Issue a 15-minute one-time reset token. MVP returns token directly
    in the response (no email service integrated yet)."""
    import hashlib
    import secrets as _secrets

    email = body.email.lower()
    user = await users_col.find_one({"email": email})
    generic = {
        "message": "If an account with that email exists, a reset token has been issued.",
        "reset_token": None,
    }
    if not user:
        return generic

    raw_token = _secrets.token_urlsafe(24)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = now_utc() + timedelta(minutes=15)
    await users_col.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "reset_token_hash": token_hash,
                "reset_token_expires_at": expires_at.isoformat(),
            }
        },
    )
    return {
        "message": "Reset token issued. It expires in 15 minutes.",
        "reset_token": raw_token,
    }


@api.post("/auth/reset-password")
async def reset_password(body: ResetPasswordIn):
    import hashlib
    import secrets as _secrets

    email = body.email.lower()
    user = await users_col.find_one({"email": email})
    generic = HTTPException(status_code=400, detail="Invalid or expired reset token")
    if not user:
        raise generic
    stored_hash = user.get("reset_token_hash")
    expires_iso = user.get("reset_token_expires_at")
    if not stored_hash or not expires_iso:
        raise generic
    try:
        expires_at = datetime.fromisoformat(expires_iso)
    except ValueError:
        raise generic
    if expires_at < now_utc():
        await users_col.update_one(
            {"id": user["id"]},
            {"$unset": {"reset_token_hash": "", "reset_token_expires_at": ""}},
        )
        raise generic
    candidate = hashlib.sha256(body.token.encode()).hexdigest()
    if not _secrets.compare_digest(candidate, stored_hash):
        raise generic
    await users_col.update_one(
        {"id": user["id"]},
        {
            "$set": {"password_hash": pwd_context.hash(body.new_password)},
            "$unset": {"reset_token_hash": "", "reset_token_expires_at": ""},
        },
    )
    return {"message": "Password has been reset. You can now sign in."}


# ---------- AI helpers ----------
def _strip_data_url(b64: str) -> str:
    if b64.startswith("data:"):
        return b64.split(",", 1)[-1]
    return b64


def _extract_json(text: str) -> Optional[dict]:
    """Extract a JSON object from LLM response text."""
    if not text:
        return None
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        try:
            return json.loads(fenced.group(1))
        except json.JSONDecodeError:
            pass
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            return None
    return None


async def call_gemini_image_edit(prompt: str, image_b64: str) -> str:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"img-{uuid.uuid4()}",
        system_message="You are KRINTERIOR AI, a world-class Indian interior designer that transforms empty rooms into photorealistic furnished interiors.",
    )
    chat.with_model("gemini", GEMINI_IMAGE_MODEL).with_params(
        modalities=["image", "text"]
    )
    msg = UserMessage(text=prompt, file_contents=[ImageContent(image_b64)])
    _text, images = await chat.send_message_multimodal_response(msg)
    if not images:
        raise HTTPException(
            status_code=502, detail="AI did not return any image. Please try again."
        )
    return images[0]["data"]


async def call_gemini_text_json(system: str, prompt: str) -> dict:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"txt-{uuid.uuid4()}",
        system_message=system,
    )
    chat.with_model("gemini", GEMINI_TEXT_MODEL)
    text = await chat.send_message(UserMessage(text=prompt))
    parsed = _extract_json(text or "")
    if parsed is None:
        raise HTTPException(status_code=502, detail="AI returned malformed response")
    return parsed


# ---------- design generation ----------
DESIGN_PROMPT_TEMPLATE = """Transform this empty room photograph into a fully furnished, photorealistic INDIAN-STYLE {room_type}.

CRITICAL RULES (must preserve from original):
- Exact same walls, windows, doors, ceiling, floor
- Same camera angle, perspective, lighting direction, shadows
- Same room geometry and dimensions
- No floating or distorted furniture, no warped walls

DESIGN GUIDELINES:
- Budget: ₹{budget:,} (Indian Rupees) – choose furniture quality and quantity accordingly
- Color palette: {color_palette}
- Style: Premium modern Indian luxury, teak/walnut wood finishes, urban Indian apartment vibe
- Add appropriate furniture for a {room_type} (sofa, tables, storage, rugs, plants, art, lighting, curtains as relevant)

USER REQUIREMENTS: {requirements}

Output ONLY the finished room image, hyper-realistic, like a high-end interior magazine photo."""


@api.post("/design/generate")
async def generate_design(
    body: GenerateDesignIn, user: dict = Depends(get_current_user)
):
    image_b64 = _strip_data_url(body.image_base64)
    if not image_b64:
        raise HTTPException(status_code=400, detail="Missing image")

    prompt = DESIGN_PROMPT_TEMPLATE.format(
        room_type=body.room_type,
        budget=body.budget,
        color_palette=body.color_palette,
        requirements=body.requirements or "Premium Indian family-friendly layout",
    )

    logger.info("Generating design for user=%s room=%s", user["id"], body.room_type)
    generated_b64 = await call_gemini_image_edit(prompt, image_b64)

    # Run space analysis, cost estimate, vastu analysis in parallel-ish (sequential awaits)
    estimate = await call_gemini_text_json(
        system="You are a furniture cost estimator for Indian retail markets. Always respond with strict JSON only.",
        prompt=f"""Generate a furniture cost estimate for an Indian {body.room_type} with a budget of ₹{body.budget}, palette '{body.color_palette}', requirements: '{body.requirements}'.

Return JSON in this EXACT schema:
{{
  "items": [
    {{"name": "string", "category": "string", "price_inr": integer}}
  ],
  "total_inr": integer,
  "currency": "INR"
}}

Rules:
- Include 6-10 items realistic for the room type (sofa/bed/table/chairs/storage/lighting/rug/curtains/plants/art)
- Use real Indian market prices (Urban Ladder, Pepperfry, IKEA India range)
- total_inr must equal sum of items.price_inr
- total_inr should be within ±10% of the budget ₹{body.budget}
- Use teak/walnut/modern Indian luxury references""",
    )

    space = await call_gemini_text_json(
        system="You are an interior space analyst. Return JSON only.",
        prompt=f"""Analyse a {body.room_type} for interior design. Return JSON:
{{
  "estimated_size_sqft": integer,
  "available_zones": ["string"],
  "design_opportunities": ["string"],
  "optimization_suggestions": ["string"]
}}
Be concise: 3-5 items per array.""",
    )

    vastu = await call_gemini_text_json(
        system="You are a Vastu Shastra expert applying ancient Indian architectural principles to a modern interior design. Return JSON only.",
        prompt=f"""Evaluate a {body.room_type} with palette '{body.color_palette}' and requirements '{body.requirements}' from a Vastu perspective. Return JSON:
{{
  "score": integer between 60 and 98,
  "summary": "one-line verdict",
  "positive_aspects": ["string"],
  "issues": ["string"],
  "recommendations": ["string"],
  "energy_flow": "string description"
}}
Rules: 3-5 items per array. Score should reflect overall Vastu alignment.""",
    )

    return {
        "generated_image": generated_b64,
        "furniture_estimate": estimate.get("items", []),
        "total_cost": int(estimate.get("total_inr", body.budget)),
        "space_analysis": space,
        "vastu_report": vastu,
        "vastu_score": int(vastu.get("score", 80)),
    }


# ---------- projects ----------
@api.post("/projects")
async def create_project(body: SaveProjectIn, user: dict = Depends(get_current_user)):
    pid = str(uuid.uuid4())
    doc = {
        "id": pid,
        "user_id": user["id"],
        "name": body.name,
        "original_image": _strip_data_url(body.original_image),
        "generated_image": _strip_data_url(body.generated_image),
        "room_type": body.room_type,
        "budget": body.budget,
        "color_palette": body.color_palette,
        "requirements": body.requirements,
        "furniture_estimate": body.furniture_estimate,
        "total_cost": body.total_cost,
        "vastu_score": body.vastu_score,
        "vastu_report": body.vastu_report,
        "space_analysis": body.space_analysis,
        "created_at": now_utc().isoformat(),
        "updated_at": now_utc().isoformat(),
    }
    await projects_col.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/projects")
async def list_projects(user: dict = Depends(get_current_user)):
    cursor = projects_col.find(
        {"user_id": user["id"]},
        {
            "_id": 0,
            "original_image": 0,  # exclude heavy fields from list
            "generated_image": 0,
            "furniture_estimate": 0,
            "vastu_report": 0,
            "space_analysis": 0,
        },
    ).sort("created_at", -1)
    return await cursor.to_list(length=200)


@api.get("/projects/{project_id}")
async def get_project(project_id: str, user: dict = Depends(get_current_user)):
    proj = await projects_col.find_one(
        {"id": project_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj


@api.patch("/projects/{project_id}")
async def rename_project(
    project_id: str,
    body: RenameProjectIn,
    user: dict = Depends(get_current_user),
):
    result = await projects_col.update_one(
        {"id": project_id, "user_id": user["id"]},
        {"$set": {"name": body.name, "updated_at": now_utc().isoformat()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    proj = await projects_col.find_one(
        {"id": project_id, "user_id": user["id"]}, {"_id": 0}
    )
    return proj


@api.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: dict = Depends(get_current_user)):
    result = await projects_col.delete_one(
        {"id": project_id, "user_id": user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True}


# ---------- vastu standalone ----------
class VastuRequest(BaseModel):
    project_id: str


@api.post("/vastu/analyze")
async def analyze_vastu(body: VastuRequest, user: dict = Depends(get_current_user)):
    proj = await projects_col.find_one(
        {"id": body.project_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    vastu = await call_gemini_text_json(
        system="You are a Vastu Shastra expert. Return JSON only.",
        prompt=f"""Re-evaluate this saved project from a deeper Vastu perspective:
Room: {proj['room_type']}, Palette: {proj['color_palette']}, Budget: ₹{proj['budget']}, Requirements: {proj.get('requirements','')}

Return JSON:
{{
  "score": integer 60-98,
  "summary": "string",
  "positive_aspects": ["string"],
  "issues": ["string"],
  "recommendations": ["string"],
  "energy_flow": "string"
}}""",
    )
    score = int(vastu.get("score", proj.get("vastu_score", 80)))
    await projects_col.update_one(
        {"id": body.project_id},
        {"$set": {"vastu_score": score, "vastu_report": vastu}},
    )
    return {"vastu_score": score, "vastu_report": vastu}


@api.get("/")
async def root():
    return {"app": "KRINTERIOR AI", "status": "ok"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await users_col.create_index("email", unique=True)
    await projects_col.create_index([("user_id", 1), ("created_at", -1)])
    logger.info("KRINTERIOR AI backend ready")


@app.on_event("shutdown")
async def shutdown():
    client.close()
