# -*- coding: utf-8 -*-
# main.py

from __future__ import annotations

from fastapi import FastAPI, Body, Query
from typing import List, Optional, Dict, Any
from pathlib import Path
import os, sys, json, subprocess

from ml.recommender.online_update import Recommender

# Giới hạn thread BLAS để tránh treo máy khi train
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")

APP = FastAPI(title="ML Recommender Service", version="1.0.0")

ROOT   = Path(__file__).resolve().parent.parent   # .../ml
RECO   = ROOT / "recommender"
STORE  = RECO / "model_store"
DATA_P = ROOT / "data" / "processed"
STORE.mkdir(parents=True, exist_ok=True)
DATA_P.mkdir(parents=True, exist_ok=True)

def run_py(script: Path, *args: str):
    cmd = [sys.executable, str(script), *args]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    print("\n========== VECTORIZE / TRAIN LOG ==========")
    print("CMD:", " ".join(cmd))
    print("--- STDOUT ---")
    print(r.stdout)
    print("--- STDERR ---")
    print(r.stderr)
    print("===========================================\n")
    return {
        "ok": r.returncode == 0,
        "cmd": cmd,
        "stdout": r.stdout,
        "stderr": r.stderr
    }


    

def write_jsonl(path: Path, rows: List[dict]) -> None:
    with open(path, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

@APP.get("/health")
def health():
    return {"status": "ok"}

@APP.post("/data/items")
def post_items(items: List[dict] = Body(...)):
    for item in items:
        if "_id" not in item:
            item["_id"] = item.get("theory_id") or item.get("name") or str(len(item))
    write_jsonl(DATA_P / "items.jsonl", items)
    return {"ok": True, "count": len(items)}

@APP.post("/data/logs")
def post_logs(
    logs: List[dict] = Body(...),
    mode: str = Query("replace", enum=["replace", "append"])
):
    import pandas as pd
    path = DATA_P / "logs.csv"
    df = pd.DataFrame(logs)
    if mode == "append" and path.exists():
        old = pd.read_csv(path)
        df = pd.concat([old, df], ignore_index=True)
    df.to_csv(path, index=False)
    return {"ok": True, "count": int(len(df)), "mode": mode}

@APP.post("/pipeline/vectorize")
def pipeline_vectorize():
    return run_py(RECO / "vectorize.py")

@APP.post("/pipeline/train")
def pipeline_train(
    kind: str = Query("als", enum=["als", "lightfm"]),
    factors: int = 64, reg: float = 0.01, iterations: int = 20,
    no_components: int = 64, epochs: int = 30, threads: int = 4
):
    if kind == "als":
        return run_py(
            RECO / "train_als.py",
            "--factors", str(factors),
            "--reg", str(reg),
            "--iterations", str(iterations),
        )
    return run_py(
        RECO / "train_lightfm.py",
        "--no-components", str(no_components),
        "--epochs", str(epochs),
        "--threads", str(threads),
    )

@APP.get("/recommend")
def http_recommend(user_id: str, k: int = 6, section: Optional[str] = None, level: Optional[int] = None):
    # Model load và recommend
    rec = Recommender().load()
    filt: Dict[str, Any] = {}
    if section:
        filt["section"] = section
    ids, reasons = rec.recommend(
        user_id=user_id,
        k=k,
        candidate_filter=(filt or None),
        user_level=(int(level) if level is not None else None),
    )
    return {
        "user_id": user_id,
        "k": k,
        "items": [{"theory_id": i, "reasons": reasons.get(i, [])} for i in ids],
    }
# nạp/quản lý dữ liệu quiz
@APP.post("/data/quizzes")
def post_quizzes(quizzes: List[dict] = Body(...)):
    path = DATA_P / "quizzes.jsonl"
    with open(path, "w", encoding="utf-8") as f:
        for q in quizzes:
            if "_id" not in q: 
                raise ValueError("quiz thiếu _id")
            if "theory_id" not in q:
                raise ValueError("quiz thiếu theory_id")
            f.write(json.dumps(q, ensure_ascii=False) + "\n")
    return {"ok": True, "count": len(quizzes)}

@APP.post("/pipeline/vectorize_quizz")
def pipeline_vectorize_quizz():
    # chạy script mới
    return run_py(ROOT / "quiz_selector" / "vectorize_quizz.py")

@APP.get("/recommend/quizz")
def http_recommend_quizz(theory_id: str, k: int = 5):
    rec = Recommender().load().load_quizz()
    ids, reasons = rec.recommend_quizz(theory_id=theory_id, k=k)
    return {
        "theory_id": theory_id,
        "k": k,
        "quiz": [{"quiz_id": i, "reasons": reasons.get(i, [])} for i in ids]
    }

