import os
import json
from typing import List, Dict, Optional
from joblib import dump, load
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import Normalizer
import numpy as np
from pymongo import MongoClient

from data_loader import load_lessons_events, load_user_recent

PACK_NAME = "model.pkl"
META_NAME = "item_meta.json"


def _build_text(doc: Dict) -> str:
    """
    Gom tối đa nội dung để TF-IDF 'hiểu bài':
    - title, summary, topic, tags
    - markdown
    - blocks: text/caption/items/rows/language
    - prereqs (tên/slug)
    - quiz_pool.tags
    """
    title = doc.get("title") or ""
    summary = doc.get("summary") or ""
    topic = doc.get("topic") or ""
    tags = doc.get("tags") or []

    markdown = doc.get("markdown") or ""
    prereqs = " ".join(doc.get("prereqs") or [])

    blocks = doc.get("blocks") or []
    block_texts = []
    for b in blocks:
        t = []
        if b.get("text"): t.append(str(b["text"]))
        if b.get("caption"): t.append(str(b["caption"]))
        if b.get("items"):
            try:
                t.extend([str(x) for x in b["items"]])
            except Exception:
                pass
        if b.get("rows"):
            try:
                for row in b["rows"]:
                    t.extend([str(x) for x in row])
            except Exception:
                pass
        if b.get("language"): t.append(str(b["language"]))
        block_texts.append(" ".join(t))
    blocks_join = " ".join(block_texts)

    qp = doc.get("quiz_pool") or []
    quiz_tags = []
    for it in qp:
        quiz_tags.extend(it.get("tags") or [])
    quiz_tags_join = " ".join(quiz_tags)

    return " ".join([
        title, summary, topic, " ".join(tags),
        prereqs, markdown, blocks_join, quiz_tags_join
    ])


class TfidfReco:
    """
    Content-based recommender (TF-IDF -> LSA optional -> Cosine)
    - Train từ Mongo (lessons)
    - Personalize: lịch sử gần đây (events) + goals (learning_states)
    - Save: model_store/model.pkl + item_meta.json
    """
    def __init__(self, model_dir="model_store", mongo_uri="mongodb://localhost:27017", db_name="yourdb"):
        self.model_dir = model_dir
        self.mongo_uri = mongo_uri
        self.db_name = db_name

        self.vectorizer = None           # TF-IDF hoặc pipeline LSA
        self.doc_matrix = None           # (n_items x d)
        self.id2idx: Dict[str, int] = {}
        self.idx2id: Dict[int, str] = {}
        self.items_meta: Dict[str, dict] = {}

        os.makedirs(self.model_dir, exist_ok=True)

    # ==== Mongo helpers ====
    def _db(self):
        cli = MongoClient(self.mongo_uri)
        # Nếu self.mongo_uri là full (có /db), PyMongo vẫn dùng DB mặc định theo chuỗi.
        return cli[self.db_name]

    def set_mongo(self, uri: str, db: str):
        self.mongo_uri = uri
        self.db_name = db

    def set_mongodb_uri_full(self, full_uri: str):
        # dạng mongodb://host:port/dbname  → cắt db_name đơn giản
        self.mongo_uri = full_uri
        try:
            name = full_uri.rsplit("/", 1)[-1]
            if name and "://" not in name:
                self.db_name = name
        except Exception:
            pass

    def save_user_goals(self, user_id: str, goals: List[str]):
        db = self._db()
        db.learning_states.update_one(
            {"userId": user_id},
            {"$set": {"userId": user_id, "goals": goals}},
            upsert=True
        )

    def load_user_goals(self, user_id: str) -> List[str]:
        db = self._db()
        st = db.learning_states.find_one({"userId": user_id}, {"goals": 1})
        return st.get("goals", []) if st else []

    # ==== Model IO ====
    def is_loaded(self) -> bool:
        return self.vectorizer is not None and self.doc_matrix is not None and len(self.idx2id) > 0

    def train_and_save(self, use_lsa: bool = True) -> str:
        lessons, _events = load_lessons_events(self.mongo_uri, self.db_name)
        if not lessons:
            # không có dữ liệu — vẫn ghi file rỗng cho an toàn
            with open(os.path.join(self.model_dir, META_NAME), "w", encoding="utf-8") as f:
                json.dump({"items": {}}, f, ensure_ascii=False)
            dump(None, os.path.join(self.model_dir, PACK_NAME))
            return os.path.join(self.model_dir, PACK_NAME)

        texts = []
        self.items_meta = {}
        self.id2idx, self.idx2id = {}, {}

        for i, doc in enumerate(lessons):
            iid = str(doc.get("_id") or doc.get("id") or doc.get("slug"))
            self.id2idx[iid] = i
            self.idx2id[i] = iid
            self.items_meta[iid] = {
                "title": doc.get("title"),
                "topic": doc.get("topic"),
                "tags": doc.get("tags") or [],
                "level": int(doc.get("level", 1)),
            }
            texts.append(_build_text(doc))

        tfidf = TfidfVectorizer(ngram_range=(1, 2), min_df=1, max_df=0.9, strip_accents="unicode")
        if use_lsa:
            svd = TruncatedSVD(n_components=min(256, max(2, len(texts)-1)))
            lsa = make_pipeline(tfidf, svd, Normalizer(copy=False))
            self.doc_matrix = lsa.fit_transform(texts)
            self.vectorizer = lsa
        else:
            self.doc_matrix = tfidf.fit_transform(texts)
            self.vectorizer = tfidf

        dump({
            "vectorizer": self.vectorizer,
            "doc_matrix": self.doc_matrix,
            "id2idx": self.id2idx,
            "idx2id": self.idx2id
        }, os.path.join(self.model_dir, PACK_NAME))

        with open(os.path.join(self.model_dir, META_NAME), "w", encoding="utf-8") as f:
            json.dump({"items": self.items_meta}, f, ensure_ascii=False)

        return os.path.join(self.model_dir, PACK_NAME)

    def load(self):
        try:
            pack = load(os.path.join(self.model_dir, PACK_NAME))
        except Exception:
            pack = None
        if pack:
            self.vectorizer = pack.get("vectorizer")
            self.doc_matrix = pack.get("doc_matrix")
            self.id2idx = pack.get("id2idx", {})
            self.idx2id = pack.get("idx2id", {})
        else:
            self.vectorizer = None
            self.doc_matrix = None
            self.id2idx, self.idx2id = {}, {}
        try:
            with open(os.path.join(self.model_dir, META_NAME), "r", encoding="utf-8") as f:
                meta = json.load(f)
            self.items_meta = meta.get("items", {})
        except Exception:
            self.items_meta = {}

    # ==== Recommend ====
    def _score_by_goals(self, goals: List[str]) -> np.ndarray:
        if not self.vectorizer or self.doc_matrix is None or not goals:
            return np.zeros((self.doc_matrix.shape[0],), dtype=float)
        q = " ".join(goals)
        qv = self.vectorizer.transform([q])
        return cosine_similarity(qv, self.doc_matrix)[0]

    def _user_profile_vector(self, recent_ids: List[str]) -> Optional[np.ndarray]:
        if not self.vectorizer or self.doc_matrix is None or not recent_ids:
            return None
        idxs = [self.id2idx[i] for i in recent_ids if i in self.id2idx]
        if not idxs:
            return None
        mat = self.doc_matrix[idxs]
        prof = mat.mean(axis=0)
        if hasattr(prof, "A1"):
            prof = prof.A1
        return np.asarray(prof).reshape(1, -1)

    def _cold_start_goals(self, k: int, max_level: Optional[int], goals: List[str]):
        cands = list(self.items_meta.keys())
        if not cands:
            return []
        goals_set = set([g for g in (goals or []) if g])

        def score_goal(iid):
            meta = self.items_meta.get(iid, {})
            tags = set(meta.get("tags") or [])
            topic = meta.get("topic")
            if topic: tags.add(topic)
            return len(tags & goals_set)

        # filter level
        filtered = []
        for iid in cands:
            lvl = self.items_meta.get(iid, {}).get("level")
            if max_level is not None and lvl is not None and int(lvl) > int(max_level):
                continue
            filtered.append(iid)

        filtered.sort(
            key=lambda x: (score_goal(x), -(self.items_meta.get(x, {}).get("level") or 0)),
            reverse=True
        )
        out = []
        for iid in filtered[:k]:
            meta = self.items_meta.get(iid, {})
            out.append({
                "id": iid,
                "score": 0.4,
                "title": meta.get("title"),
                "topic": meta.get("topic"),
                "level": meta.get("level"),
            })
        return out

    def recommend(self, user_id: str, k: int = 5, max_level: Optional[int] = None, goals: List[str] = []):
        # goals ưu tiên param; nếu rỗng thì đọc từ DB
        if not goals:
            goals = self.load_user_goals(user_id)

        # lấy known_topics để lọc ra khỏi gợi ý
        st = self._db().learning_states.find_one({"userId": user_id}, {"known_topics": 1})
        known = set(st.get("known_topics", [])) if st else set()

        if not self.is_loaded():
            recs = self._cold_start_goals(k, max_level, goals)
            # lọc known trong cold-start
            clean = []
            for r in recs:
                meta = self.items_meta.get(r["id"], {})
                tags = set(meta.get("tags") or []) | {meta.get("topic")}
                if not (tags & known):
                    clean.append(r)
            return clean

        recent = load_user_recent(self.mongo_uri, self.db_name, user_id, limit=20)
        seen = set(recent)
        prof = self._user_profile_vector(recent)
        goal_scores = self._score_by_goals(goals)

        if prof is not None:
            sims = cosine_similarity(prof, self.doc_matrix)[0]
            sims = 0.8 * sims + 0.2 * goal_scores
        else:
            sims = goal_scores

        order = np.argsort(-sims)
        recs = []
        for idx in order:
            iid = self.idx2id.get(int(idx))
            if not iid or iid in seen:
                continue
            meta = self.items_meta.get(iid, {})
            lvl = meta.get("level")
            if max_level is not None and lvl is not None and int(lvl) > int(max_level):
                continue
            recs.append({
                "id": iid,
                "score": float(sims[idx]),
                "title": meta.get("title"),
                "topic": meta.get("topic"),
                "level": meta.get("level"),
            })
            if len(recs) >= k * 2:  # build over then filter known
                break

        # lọc bỏ bài user đã biết (known_topics)
        clean = []
        for r in recs:
            meta = self.items_meta.get(r["id"], {})
            tags = set(meta.get("tags") or []) | {meta.get("topic")}
            if not (tags & known):
                clean.append(r)
            if len(clean) >= k:
                break

        # nếu chưa đủ k, bổ sung cold-start (cũng lọc known)
        if len(clean) < k:
            needed = k - len(clean)
            cold = self._cold_start_goals(needed, max_level, goals)
            for r in cold:
                meta = self.items_meta.get(r["id"], {})
                tags = set(meta.get("tags") or []) | {meta.get("topic")}
                if not (tags & known):
                    clean.append(r)
                    if len(clean) >= k:
                        break

        return clean
