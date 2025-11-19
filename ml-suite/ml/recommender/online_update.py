# -*- coding: utf-8 -*-
from __future__ import annotations
import json
import numpy as np
from pathlib import Path

ROOT  = Path(__file__).resolve().parent
STORE = ROOT / "model_store"

class Recommender:
    def __init__(self):
        self.U = self.V = None
        self.item2idx = {}; self.idx2item = {}
        self.user2idx = {}; self.idx2user = {}
        self.popularity = {}

    def load(self):
        # mappings
        m = json.loads((STORE / "mappings.json").read_text(encoding="utf-8"))
        self.item2idx = {k:int(v) if str(v).isdigit() else v for k,v in m["item2idx"].items()}
        self.idx2item = {int(k): v for k,v in m["idx2item"].items()}
        self.user2idx = {k:int(v) if str(v).isdigit() else v for k,v in m["user2idx"].items()}
        self.idx2user = {int(k): v for k,v in m["idx2user"].items()}

        # popularity (optional)
        p = STORE / "popularity.json"
        if p.exists():
            self.popularity = json.loads(p.read_text(encoding="utf-8"))

        # ALS model
        z = np.load(STORE / "als_model.npz")
        self.U = z["U"]  # expected: users x factors
        self.V = z["V"]  # expected: items x factors

        # 🔧 Auto-fix nếu bị đảo (như log U=(5,64), V=(1,64))
        n_users = len(self.user2idx)
        n_items = len(self.item2idx)
        if self.U.shape[0] == n_items and self.V.shape[0] == n_users:
            self.U, self.V = self.V, self.U  # swap back

        print(f"[load] U={self.U.shape}, V={self.V.shape}")
        return self

    
    def recommend(self, user_id: str, k: int = 6, candidate_filter=None, user_level=None):
        item_count = len(self.idx2item)
        all_items  = [self.idx2item[i] for i in range(item_count)]

        # cold-start fallback
        uidx = self.user2idx.get(user_id)
        if uidx is None or uidx >= self.U.shape[0]:
            top = sorted(self.popularity.items(), key=lambda x: x[1], reverse=True)
            picks = [i for i, _ in top][:k] if top else all_items[:k]
            return picks, {i: ["cold-start"] for i in picks}

        # score = U[u] · V^T  -> (items,)
        scores = (self.V @ self.U[uidx].astype(np.float32)).ravel()
        order  = np.argsort(-scores)

        # (tuỳ chọn) lọc theo candidate_filter ở đây nếu muốn – hiện bỏ qua để chắc chắn ra đủ k
        picks = [self.idx2item[int(i)] for i in order[:min(k, item_count)]]

        # Nếu vì lý do nào đó < k, bù thêm từ danh sách còn lại
        if len(picks) < k:
            rest = [self.idx2item[int(i)] for i in order if self.idx2item[int(i)] not in picks]
            picks += rest[:(k - len(picks))]

        return picks[:k], {it: [] for it in picks[:k]}

# === QUIZZ ===
    def load_quizz(self):
        import json, numpy as np
        from scipy import sparse
        # cần các mapping/items đã load sẵn từ load() (item2idx/idx2item)
        # nạp item_features để lấy vector theory
        self.X_items = sparse.load_npz(STORE / "item_features.npz").tocsr()

        mq = json.loads((STORE / "mappings_quizz.json").read_text(encoding="utf-8"))
        self.quiz2idx   = {k:int(v) for k,v in mq["quiz2idx"].items()}
        self.idx2quiz   = {int(k): v for k,v in mq["idx2quiz"].items()}
        self.quizTheory = mq["quiz_theory"]  # list aligned với index

        from scipy import sparse as sp
        self.X_quiz = sp.load_npz(STORE / "quiz_features.npz").tocsr()
        print(f"[load_quizz] X_items={self.X_items.shape}, X_quiz={self.X_quiz.shape}")
        return self

    def recommend_quizz(self, theory_id: str, k: int = 5):
       tidx = self.item2idx.get(theory_id)
       if tidx is None:
           return [], {}
       x = self.X_items[tidx]   # vector của theory

    # các quiz thuộc theory này
       cand_idx = [i for i, t in enumerate(self.quizTheory) if t == theory_id]
       if not cand_idx:
            return [], {}

    # cosine (đã L2-normalize → dùng dot)
       scores = (self.X_quiz[cand_idx] @ x.T).toarray().ravel()

    # sort & lấy top-k
       order = np.argsort(-scores)[:min(k, len(cand_idx))]
       picked_idx = [cand_idx[i] for i in order]
       picked_ids = [self.idx2quiz[i] for i in picked_idx]

    # reasons đơn giản: top feature overlap (tags/skills) & difficulty gần
    # (nếu có metadata quiz trong quizzes.jsonl, có thể load để lý do phong phú hơn)
       reasons = {qid: [f"similar_to:{theory_id}", f"score:{scores[o]:.3f}"] 
               for qid, o in zip(picked_ids, order)}

       return picked_ids, reasons

