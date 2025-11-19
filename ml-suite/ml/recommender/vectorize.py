# -*- coding: utf-8 -*-
"""
Vector hóa item & interactions (Model A).

Input:
- ml/data/processed/items.jsonl
- ml/data/processed/logs.csv

Artifacts:
- ml/recommender/model_store/vocab.json
- ml/recommender/model_store/mappings.json
- ml/recommender/model_store/item_features.npz
- ml/recommender/model_store/interactions.npz
- ml/recommender/model_store/popularity.json
- ml/recommender/model_store/vectorize_meta.json
"""
from __future__ import annotations
import json
from pathlib import Path
from collections import Counter
from typing import Dict, List
import numpy as np
import pandas as pd
from scipy import sparse

# --- PATH ---
ROOT = Path(__file__).resolve().parent
DATA = ROOT.parent / "data" / "processed"
STORE = ROOT / "model_store"
STORE.mkdir(parents=True, exist_ok=True)

# ---------------- IO ----------------
def load_items(path: Path = DATA / "items.jsonl") -> pd.DataFrame:
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    df = pd.DataFrame(rows)
    if "_id" not in df.columns:
        if "theory_id" in df.columns:
            df["_id"] = df["theory_id"].astype(str)
        else:
            raise ValueError("items.jsonl thiếu trường _id")

    # Chuẩn hóa các cột thường dùng
    for col in ("section", "level", "order"):
        if col not in df.columns:
            df[col] = None
    for col in ("tags", "skills"):
        if col not in df.columns:
            df[col] = [[] for _ in range(len(df))]
        else:
            df[col] = df[col].apply(lambda x: x or [])
    if "difficulty" not in df.columns:
        df["difficulty"] = 3

    df["_id"] = df["_id"].astype(str).str.strip()
    df["difficulty"] = pd.to_numeric(df["difficulty"], errors="coerce").fillna(3).clip(1, 5).astype(float)
    return df


def load_logs(path: Path = DATA / "logs.csv") -> pd.DataFrame:
    df = pd.read_csv(
        path,
        dtype={"user_id": str, "theory_id": str, "event": str},
        keep_default_na=False,
        na_values=[],
        low_memory=False,
    )
    for c in ("user_id", "theory_id", "event"):
        df[c] = df[c].astype(str).str.strip()
    df = df[(df["user_id"] != "") & (df["theory_id"] != "")]
    return df


# ---------------- Build ----------------
def build_vocab(items: pd.DataFrame) -> Dict[str, List[str]]:
    tags = sorted({t for arr in items["tags"] for t in (arr or [])})
    skills = sorted({s for arr in items["skills"] for s in (arr or [])})
    return {"tags": tags, "skills": skills, "dim": len(tags) + len(skills) + 1}


def build_mappings(items: pd.DataFrame, logs: pd.DataFrame):
    item_ids = list(items["_id"].astype(str))
    item2idx = {it: i for i, it in enumerate(item_ids)}
    idx2item = {str(i): it for it, i in item2idx.items()}
    user_ids = sorted(set(logs["user_id"].astype(str))) if not logs.empty else []
    user2idx = {u: i for i, u in enumerate(user_ids)}
    idx2user = {str(i): u for u, i in user2idx.items()}
    return item2idx, idx2item, user2idx, idx2user


def build_item_features(items: pd.DataFrame, vocab: Dict[str, List[str]]) -> sparse.csr_matrix:
    dim = vocab["dim"]
    tag2i = {t: i for i, t in enumerate(vocab["tags"])}
    skill2i = {s: i for i, s in enumerate(vocab["skills"])}
    off = len(vocab["tags"])

    rows, cols, data = [], [], []
    for r, row in enumerate(items.itertuples(index=False)):
        for t in getattr(row, "tags"):
            i = tag2i.get(t)
            if i is not None:
                rows.append(r)
                cols.append(i)
                data.append(1.0)
        for s in getattr(row, "skills"):
            j = skill2i.get(s)
            if j is not None:
                rows.append(r)
                cols.append(off + j)
                data.append(1.0)
        rows.append(r)
        cols.append(dim - 1)
        data.append(float(getattr(row, "difficulty", 3)) / 5.0)

    X = sparse.csr_matrix(
        (np.array(data, dtype=np.float32), (np.array(rows), np.array(cols))),
        shape=(len(items), dim),
    )
    n = np.sqrt(X.multiply(X).sum(1)).A.ravel() + 1e-8
    X = X.multiply(1.0 / n[:, None]).tocsr()
    return X


def build_interactions(logs: pd.DataFrame, item2idx: dict[str, int], user2idx: dict[str, int]):
    rows, cols, data = [], [], []
    missing_items, missing_users = set(), set()

    for u, i in zip(logs["user_id"], logs["theory_id"]):
        iu = user2idx.get(u)
        ii = item2idx.get(i)
        if iu is None:
            missing_users.add(u)
            continue
        if ii is None:
            missing_items.add(i)
            continue
        rows.append(iu)
        cols.append(ii)
        data.append(1.0)

    n_users = max(len(user2idx), 1)
    n_items = max(len(item2idx), 1)

    if not rows:
        print(f"⚠️ Không có tương tác hợp lệ. missing_users={len(missing_users)} missing_items={len(missing_items)}")
        return sparse.coo_matrix((n_users, n_items), dtype=np.float32)

    coo = sparse.coo_matrix((data, (rows, cols)), shape=(n_users, n_items), dtype=np.float32)
    coo.sum_duplicates()
    return coo.tocoo()


def compute_popularity(logs: pd.DataFrame) -> Dict[str, float]:
    if logs.empty:
        return {}
    ctr = Counter(logs["theory_id"].astype(str))
    if not ctr:
        return {}
    mx = max(ctr.values())
    return {k: v / mx for k, v in ctr.items()}


def main():
    items = load_items()
    logs = load_logs()

    valid_ids = set(items["_id"].astype(str))
    logs = logs[logs["theory_id"].isin(valid_ids)]

    vocab = build_vocab(items)
    item2idx, idx2item, user2idx, idx2user = build_mappings(items, logs)
    X_items = build_item_features(items, vocab)

    R_ui = build_interactions(logs, item2idx, user2idx)
    if R_ui is None or R_ui.shape[0] == 0 or R_ui.shape[1] == 0:
        print("⚠️ Không có tương tác hợp lệ giữa user và item! Tạo ma trận rỗng.")
        R_ui = sparse.coo_matrix((len(user2idx), len(item2idx)), dtype=np.float32)

    popularity = compute_popularity(logs)

    for p in ("item_features.npz", "interactions.npz"):
        (STORE / p).unlink(missing_ok=True)

    sparse.save_npz(STORE / "item_features.npz", X_items)
    sparse.save_npz(STORE / "interactions.npz", R_ui.tocoo())

    (STORE / "vocab.json").write_text(
        json.dumps({"tags": vocab["tags"], "skills": vocab["skills"]}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    (STORE / "mappings.json").write_text(
        json.dumps(
            {"item2idx": item2idx, "idx2item": idx2item, "user2idx": user2idx, "idx2user": idx2user},
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    (STORE / "popularity.json").write_text(json.dumps(popularity, ensure_ascii=False), encoding="utf-8")

    (STORE / "vectorize_meta.json").write_text(
        json.dumps(
            {"items": int(X_items.shape[0]), "dim": int(X_items.shape[1]), "users": int(R_ui.shape[0])},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"[vectorize] items={X_items.shape}, interactions={R_ui.shape}, dim={X_items.shape[1]}")


if __name__ == "__main__":
    main()
