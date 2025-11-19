# -*- coding: utf-8 -*-
from __future__ import annotations
import json
from pathlib import Path
from typing import Dict, List
import numpy as np
import pandas as pd
from scipy import sparse

ROOT   = Path(__file__).resolve().parent          # .../ml/quiz_selector
RECO   = ROOT.parent / "recommender"              # .../ml/recommender
DATA   = ROOT.parent / "data" / "processed"
STORE  = RECO / "model_store"                     # dùng chung store với model A
STORE.mkdir(parents=True, exist_ok=True)

def _load_items() -> pd.DataFrame:
    rows = [json.loads(l) for l in (DATA / "items.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]
    df = pd.DataFrame(rows)
    if "_id" not in df.columns:
        if "theory_id" in df.columns:
            df["_id"] = df["theory_id"].astype(str)
        else:
            raise ValueError("items.jsonl thiếu _id")
    for col in ("tags","skills"): 
        if col not in df.columns: df[col] = [[] for _ in range(len(df))]
        else: df[col] = df[col].apply(lambda x: x or [])
    if "difficulty" not in df.columns: df["difficulty"] = 3
    df["_id"] = df["_id"].astype(str)
    return df

def _load_quizzes() -> pd.DataFrame:
    rows = [json.loads(l) for l in (DATA / "quizzes.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]
    df = pd.DataFrame(rows)
    req = ["_id","theory_id"]
    for c in req:
        if c not in df.columns: raise ValueError(f"quizzes.jsonl thiếu trường {c}")
    for col in ("tags","skills"):
        if col not in df.columns: df[col] = [[] for _ in range(len(df))]
        else: df[col] = df[col].apply(lambda x: x or [])
    if "difficulty" not in df.columns: df["difficulty"] = 3
    df["_id"] = df["_id"].astype(str); df["theory_id"] = df["theory_id"].astype(str)
    return df

def _load_vocab() -> Dict[str, List[str]]:
    # dùng vocab của items để đồng trục với item_features.npz (không thay đổi dim)
    vocab_path = STORE / "vocab.json"
    v = json.loads(vocab_path.read_text(encoding="utf-8"))
    return {"tags": v["tags"], "skills": v["skills"], "dim": len(v["tags"]) + len(v["skills"]) + 1}

def _build_features(df: pd.DataFrame, vocab: Dict[str, List[str]]) -> sparse.csr_matrix:
    dim = vocab["dim"]
    tag2i = {t:i for i,t in enumerate(vocab["tags"])}
    skill2i = {s:i for i,s in enumerate(vocab["skills"])}
    off = len(vocab["tags"])

    rows, cols, data = [], [], []
    for r, row in enumerate(df.itertuples(index=False)):
        for t in getattr(row, "tags"):
            i = tag2i.get(t)
            if i is not None: rows.append(r); cols.append(i); data.append(1.0)
        for s in getattr(row, "skills"):
            j = skill2i.get(s)
            if j is not None: rows.append(r); cols.append(off + j); data.append(1.0)
        rows.append(r); cols.append(dim-1); data.append(float(getattr(row, "difficulty", 3))/5.0)

    X = sparse.csr_matrix((np.array(data, dtype=np.float32), (np.array(rows), np.array(cols))),
                          shape=(len(df), dim))
    n = np.sqrt(X.multiply(X).sum(1)).A.ravel() + 1e-8
    return X.multiply(1.0/n[:,None]).tocsr()

def main():
    items   = _load_items()
    quizzes = _load_quizzes()
    # chỉ giữ quiz có theory_id tồn tại
    valid = set(items["_id"].astype(str))
    quizzes = quizzes[quizzes["theory_id"].isin(valid)].reset_index(drop=True)

    vocab = _load_vocab()
    Xq = _build_features(quizzes, vocab)

    quiz2idx = {row["_id"]: i for i, row in quizzes.reset_index(drop=True).iterrows()}
    idx2quiz = {i: q for q, i in quiz2idx.items()}
    quiz_theory = [t for t in quizzes["theory_id"].tolist()]

    # lưu
    from scipy import sparse
    sparse.save_npz(STORE / "quiz_features.npz", Xq)
    (STORE / "mappings_quizz.json").write_text(
        json.dumps({"quiz2idx": quiz2idx, "idx2quiz": idx2quiz, "quiz_theory": quiz_theory},
                   ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    (STORE / "quizz_meta.json").write_text(
        json.dumps({"quizzes": int(Xq.shape[0]), "dim": int(Xq.shape[1])}, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print(f"[vectorize_quizz] quizzes={Xq.shape}")

if __name__ == "__main__":
    main()
