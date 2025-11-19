# -*- coding: utf-8 -*-
"""
Huấn luyện mô hình ALS từ dữ liệu thật (interactions.npz)
"""

from __future__ import annotations
import argparse, json
from pathlib import Path
import numpy as np
from scipy import sparse

# Thư viện implicit (phải có: pip install implicit)
try:
    from implicit.als import AlternatingLeastSquares
except Exception as e:
    raise RuntimeError("Thiếu thư viện 'implicit'. Cài: pip install implicit") from e

ROOT  = Path(__file__).resolve().parent
STORE = ROOT / "model_store"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--factors", type=int, default=64)
    parser.add_argument("--iterations", type=int, default=20)
    parser.add_argument("--reg", type=float, default=0.01)
    args = parser.parse_args()

    # 1️⃣ Load dữ liệu thật từ vectorize
    R_path = STORE / "interactions.npz"
    map_path = STORE / "mappings.json"

    assert R_path.exists(), f"❌ Thiếu file {R_path}"
    assert map_path.exists(), f"❌ Thiếu file {map_path}"

    R = sparse.load_npz(R_path).tocsr()
    mappings = json.loads(map_path.read_text(encoding="utf-8"))
    user2idx = mappings.get("user2idx", {})
    item2idx = mappings.get("item2idx", {})

    # 2️⃣ Huấn luyện mô hình ALS
    model = AlternatingLeastSquares(
        factors=args.factors,
        iterations=args.iterations,
        regularization=args.reg,
        random_state=42,
        calculate_training_loss=False,
    )
    model.fit(R.T)  # implicit yêu cầu item-user

    # 3️⃣ Lưu lại model thật
    U = model.user_factors.astype(np.float32)
    V = model.item_factors.astype(np.float32)
    np.savez_compressed(
        STORE / "als_model.npz",
        U=U,
        V=V,
        meta=np.array([args.factors, args.iterations, args.reg], dtype=float)
    )

    print("[ALS] trained & saved.")
    print({
        "factors": args.factors,
        "iterations": args.iterations,
        "regularization": args.reg,
        "users": R.shape[0],
        "items": R.shape[1]
    })

if __name__ == "__main__":
    main()
