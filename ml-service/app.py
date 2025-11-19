import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient

from tfidf_service import TfidfReco
from questions import DEFAULT_QUESTIONS, answers_to_goals, infer_max_level

APP_TITLE = os.environ.get("APP_TITLE", "Guitar TF-IDF Recommender")
MODEL_DIR = os.environ.get("MODEL_DIR", "model_store")

MONGODB_URI_FULL = os.environ.get("MONGODB_URI")
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.environ.get("MONGO_DB", "chorddb")

app = FastAPI(title=APP_TITLE)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

ENGINE: Optional[TfidfReco] = None


class TrainReq(BaseModel):
    mongo_uri: Optional[str] = None
    db_name: Optional[str] = None
    use_lsa: bool = True


class RecReq(BaseModel):
    userId: str
    k: int = 5
    maxLevel: Optional[int] = None
    goals: Optional[List[str]] = None


class SaveAnswersReq(BaseModel):
    userId: str
    answers: dict  # {questionKey: optionKey or [optionKey,...]}


@app.on_event("startup")
def _startup():
    global ENGINE
    ENGINE = TfidfReco(model_dir=MODEL_DIR, mongo_uri=MONGO_URI, db_name=MONGO_DB)
    if MONGODB_URI_FULL:
        ENGINE.set_mongodb_uri_full(MONGODB_URI_FULL)
    ENGINE.load()


@app.get("/health")
def health():
    return {"ok": True, "model_loaded": ENGINE.is_loaded()}


@app.get("/questions")
def get_questions():
    return {"questions": DEFAULT_QUESTIONS}


@app.post("/save-answers")
def save_answers(req: SaveAnswersReq):
    """
    Lưu câu trả lời:
    - Tự động tách "đã biết" (known_topics) từ phần basic
    - Sinh goals học mới và lưu vào learning_states
    """
    try:
        goals = answers_to_goals(req.answers)
        level_hint = infer_max_level(req.answers)

        # 🧠 Tách kỹ năng đã biết
        basic_known = []
        if "basic" in req.answers:
            basic_known = [x for x in req.answers["basic"] if isinstance(x, str)]

        db = ENGINE._db()
        db.learning_states.update_one(
            {"userId": req.userId},
            {
                "$set": {
                    "userId": req.userId,
                    "answers": req.answers,
                    "goals": goals,
                    "levelHint": level_hint,
                    "known_topics": basic_known
                }
            },
            upsert=True
        )
        return {"ok": True, "goals": goals, "levelHint": level_hint, "known": basic_known}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/train")
def train(req: TrainReq):
    try:
        if req.mongo_uri and req.db_name:
            ENGINE.set_mongo(req.mongo_uri, req.db_name)
        path = ENGINE.train_and_save(use_lsa=req.use_lsa)
        ENGINE.load()
        return {"ok": True, "model_path": path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommend")
def recommend(req: RecReq):
    """
    Gợi ý bài học, bỏ qua những topic/tags nằm trong 'known_topics'.
    """
    try:
        max_level = req.maxLevel
        db = ENGINE._db()
        st = db.learning_states.find_one({"userId": req.userId}, {"levelHint": 1, "known_topics": 1})

        known = set(st.get("known_topics", [])) if st else set()
        if max_level is None and st:
            max_level = st.get("levelHint")

        items = ENGINE.recommend(
            user_id=req.userId,
            k=req.k,
            max_level=max_level,
            goals=req.goals or []
        )

        # ❌ Lọc bỏ những bài user đã biết
        filtered = []
        for it in items:
            meta = ENGINE.items_meta.get(it["id"], {})
            tags = set(meta.get("tags", [])) | {meta.get("topic")}
            if not (tags & known):
                filtered.append(it)

        return {"items": filtered}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/known")
def get_known(userId: str):
    """
    Trả về danh sách bài tương ứng với known_topics để hiển thị "Ôn tập".
    """
    try:
        db = ENGINE._db()
        st = db.learning_states.find_one({"userId": userId}, {"known_topics": 1})
        if not st or not st.get("known_topics"):
            return {"items": []}

        known = set(st["known_topics"])
        items = []
        for iid, meta in ENGINE.items_meta.items():
            tags = set(meta.get("tags", [])) | {meta.get("topic")}
            if tags & known:
                items.append({"id": iid, **meta})
        return {"items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
