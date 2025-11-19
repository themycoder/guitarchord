# -*- coding: utf-8 -*-
"""
Train LightFM (WARP) dùng artifacts của vectorize.py.

Artifacts in:
- interactions.npz
- item_features.npz

Output:
- lightfm_model.pkl
- lightfm_meta.json
"""
from __future__ import annotations
import os, argparse, json
from pathlib import Path

# Hạn chế thread để ổn định timing
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")

try:
    import joblib
    from scipy import sparse
except ImportError as e:
    raise SystemExit("Thiếu joblib/scipy. pip install joblib scipy==1.11.4") from e

try:
    from lightfm import LightFM
except ImportError as e:
    raise SystemExit("Thiếu lightfm. Gợi ý: pip install --only-binary=:all: lightfm==1.17") from e

ROOT  = Path(__file__).resolve().parent
STORE = ROOT / "model_store"

def load_artifacts():
    interactions = STORE / "interactions.npz"
    item_features = STORE / "item_features.npz"
    if not interactions.exists() or not item_features.exists():
        raise FileNotFoundError("Thiếu artifacts. Hãy chạy vectorize.py trước.")
    R_ui   = sparse.load_npz(interactions).tocsr()
    X_items= sparse.load_npz(item_features).tocsr()
    return R_ui, X_items

def main(no_components: int = 64, epochs: int = 30, num_threads: int = 4):
    R_ui, X_items = load_artifacts()
    model = LightFM(loss="warp", no_components=no_components, random_state=42)
    model.fit(R_ui, item_features=X_items, epochs=epochs, num_threads=num_threads, verbose=True)

    STORE.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, STORE / "lightfm_model.pkl")
    meta = {
        "no_components": model.no_components,
        "interactions_shape": tuple(map(int, R_ui.shape)),
        "item_features_shape": tuple(map(int, X_items.shape)),
        "epochs": epochs,
    }
    (STORE / "lightfm_meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print("[LightFM] trained & saved.")
    print(meta)

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-components", type=int, default=64, dest="no_components")
    ap.add_argument("--epochs", type=int, default=30)
    ap.add_argument("--threads", type=int, default=4, dest="num_threads")
    args = ap.parse_args()
    main(args.no_components, args.epochs, args.num_threads)
