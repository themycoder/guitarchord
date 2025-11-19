// src/admin/pages/Theory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/apiClient";

/** ===== HELPERS ===== */
const cx = (...a) => a.filter(Boolean).join(" ");

const tones = ["info", "success", "warning", "danger"];

/** Giải mã JWT rất nhẹ không cần lib */
function decodeJWT(token) {
  try {
    const [, p] = String(token || "").split(".");
    return p ? JSON.parse(atob(p)) : null;
  } catch {
    return null;
  }
}
function getCurrentUserFromToken() {
  const { accessToken } = api.readTokens?.() || {};
  const payload = decodeJWT(accessToken);
  // payload thường có: sub, role, displayName, iat, exp
  return payload || null;
}

/** ===== BLOCK PRESETS ===== */
const BASE_BLOCKS = {
  heading: { level: 2, text: "", id: undefined },
  paragraph: { text: "" },
  list: { items: [], ordered: false },
  image: { src: "", alt: "", caption: "", width: "100%" },
  chord: {
    name: "",
    startFret: 1,
    strings: ["x", "x", "x", "x", "x", "x"],
    fingers: [null, null, null, null, null, null],
  },
  code: { language: "", code: "" },
  callout: { title: "", text: "", tone: "info" },
  quote: { text: "", cite: "" },
  divider: {},
  columns: { columns: [[], []] },
};

/** ===== PAGE ===== */
export default function TheoryAdmin() {
  const [tab, setTab] = useState("list"); // list | edit
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");

  // Thông tin người dùng hiện tại (giải từ JWT)
  const [who, setWho] = useState(() => getCurrentUserFromToken());
  useEffect(() => {
    // cho phép F5 vẫn cập nhật who
    setWho(getCurrentUserFromToken());
  }, []);

  const EMPTY = useMemo(
    () => ({
      theory_id: "",
      title: "",
      tags: [],
      skills: [],
      level: "beginner",
      difficulty: 1,
      summary: "",
      contentUrl: "",
      status: "draft",
      contentBlocks: { blocks: [] },
    }),
    []
  );

  const [item, setItem] = useState(EMPTY);

  /** ========== UTILS: quyền ========== */
  function canWrite() {
    const role = who?.role;
    return role === "admin" || role === "editor";
  }
  function requireWriteGuard() {
    if (canWrite()) return true;
    setError(
      "Bạn không có quyền thực hiện hành động này (cần role admin/editor)."
    );
    setTimeout(() => setError(""), 3000);
    return false;
  }
  function showApiError(e, fallback = "Thao tác thất bại.") {
    const msg =
      e?.data?.message ||
      e?.data?.error ||
      e?.message ||
      `${fallback} (HTTP ${e?.status ?? "?"})`;
    if (e?.status === 401) {
      setError("Hết phiên đăng nhập. Vui lòng đăng nhập lại.");
    } else if (e?.status === 403) {
      setError(
        "Bạn không có quyền (403). Hãy đăng nhập tài khoản có quyền admin/editor."
      );
    } else {
      setError(msg);
    }
    setTimeout(() => setError(""), 3500);
  }

  /* ========== LIST ========== */
  async function loadList() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "100", sort: "-createdAt" });
      if (q) params.set("q", q);
      const d = await api.get(`/api/theory?${params.toString()}`, {
        auth: false, // GET list có thể public
      });
      const arr = Array.isArray(d?.items)
        ? d.items
        : Array.isArray(d?.data)
        ? d.data
        : [];
      setItems(arr);
    } catch (e) {
      showApiError(e, "Không tải được danh sách.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadList();
  }, []);

  function newArticle() {
    setItem(EMPTY);
    setTab("edit");
  }

  async function openById(id) {
    if (!id) return;
    setLoading(true);
    setError("");
    setFlash("");
    try {
      const data = await api.get(`/api/theory/${encodeURIComponent(id)}`, {
        auth: false, // GET detail public
      });
      setItem({
        theory_id: data.theory_id || id,
        title: data.title || "",
        tags: data.tags || [],
        skills: data.skills || [],
        level: data.level || "beginner",
        difficulty: data.difficulty ?? 1,
        summary: data.summary || "",
        contentUrl: data.contentUrl || "",
        status: data.status || "draft",
        contentBlocks: {
          blocks: normalizeBlocks(
            data?.contentBlocks?.blocks || data?.blocks || []
          ),
        },
      });
      setTab("edit");
      setFlash("Đã nạp bài.");
      setTimeout(() => setFlash(""), 2000);
    } catch (e) {
      showApiError(e, "Không tìm thấy theory.");
    } finally {
      setLoading(false);
    }
  }

  async function removeById(id) {
    if (!id) return;
    if (!requireWriteGuard()) return;
    if (!confirm(`Xoá bài: ${id}?`)) return;
    try {
      await api.del(`/api/theory/${encodeURIComponent(id)}`); // DELETE cần auth
      setFlash("Đã xoá.");
      setTimeout(() => setFlash(""), 1500);
      await loadList();
    } catch (e) {
      showApiError(e, "Xoá thất bại.");
    }
  }

  /* ========== SAVE ========== */
  async function createOrUpdate(publish = false) {
    if (!requireWriteGuard()) return;

    const id = item.theory_id?.trim();
    if (!id) return alert("Nhập theory_id trước khi lưu.");

    const payload = {
      theory_id: id,
      title: item.title || null,
      tags: item.tags || [],
      skills: item.skills || [],
      level: item.level || "beginner",
      difficulty: Number(item.difficulty) || 1,
      summary: item.summary || null,
      contentUrl: item.contentUrl || null,
      status: publish ? "published" : item.status || "draft",
      contentBlocks: {
        blocks: (item.contentBlocks?.blocks || []).map(sanitizeBlock),
      },
    };

    setLoading(true);
    setError("");
    setFlash("");
    try {
      // Check tồn tại (public GET)
      let exists = true;
      try {
        await api.get(`/api/theory/${encodeURIComponent(id)}`, { auth: false });
      } catch {
        exists = false;
      }

      if (exists) {
        // Ưu tiên PUT, fallback PATCH
        try {
          await api.put(`/api/theory/${encodeURIComponent(id)}`, payload);
        } catch (e) {
          await api.patch(`/api/theory/${encodeURIComponent(id)}`, payload);
        }
        setFlash(publish ? "Đã xuất bản." : "Đã lưu bản chỉnh sửa.");
      } else {
        await api.post(`/api/theory`, payload);
        setFlash("Đã tạo bài mới.");
      }
      setTimeout(() => setFlash(""), 2200);
      await loadList();
    } catch (e) {
      showApiError(e, "Lưu thất bại.");
    } finally {
      setLoading(false);
    }
  }

  /* ========== TOC ========== */
  const toc = useMemo(() => {
    const blocks = item.contentBlocks?.blocks || [];
    const items = [];
    blocks.forEach((b, i) => {
      if (b.type === "heading") {
        const lvl = b.props?.level || 2;
        const id = `h-${lvl}-${i}`;
        const text = (b.props?.text || "").trim();
        if (text) items.push({ id, level: lvl, text });
      }
    });
    return items;
  }, [item.contentBlocks]);

  /* ========== RENDER ========== */
  const roleBadge =
    who?.role &&
    (who.role === "admin" || who.role === "editor" ? (
      <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 border border-emerald-200">
        {who.role}
      </span>
    ) : (
      <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 border border-yellow-200">
        {who.role || "guest"}
      </span>
    ));

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* NAV */}
        <div className="flex items-center gap-2 mb-4">
          <button
            className={cx(
              "px-3 py-2 rounded-lg border",
              tab === "list"
                ? "bg-gray-900 text-white border-gray-900"
                : "hover:bg-gray-50"
            )}
            onClick={() => setTab("list")}
          >
            Danh sách
          </button>
          <button
            className={cx(
              "px-3 py-2 rounded-lg border",
              tab === "edit"
                ? "bg-gray-900 text-white border-gray-900"
                : "hover:bg-gray-50"
            )}
            onClick={() => setTab("edit")}
          >
            Chỉnh sửa
          </button>
          <div className="flex-1" />
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <span>Tài khoản:</span>
            {roleBadge}
          </div>
          <button className="px-3 py-2 rounded-lg border" onClick={newArticle}>
            + Bài mới
          </button>
        </div>

        {(flash || error) && (
          <div className="mb-4">
            {flash && (
              <div className="px-3 py-2 border rounded-xl bg-emerald-50 text-emerald-800 border-emerald-200">
                {flash}
              </div>
            )}
            {error && (
              <div className="px-3 py-2 border rounded-xl bg-red-50 text-red-800 border-red-200">
                {error}
              </div>
            )}
          </div>
        )}

        {tab === "list" ? (
          <ListPanel
            items={items}
            q={q}
            setQ={setQ}
            loading={loading}
            onFilter={loadList}
            onEdit={openById}
            onDelete={removeById}
          />
        ) : (
          <EditPanel
            item={item}
            setItem={setItem}
            toc={toc}
            loading={loading}
            onSaveDraft={() => createOrUpdate(false)}
            onPublish={() => createOrUpdate(true)}
            onLoad={(id) => openById(id)}
          />
        )}
      </div>
    </div>
  );
}

/* ===== LIST ===== */
function ListPanel({ items, q, setQ, loading, onFilter, onEdit, onDelete }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end gap-2">
        <label className="flex-1 block">
          <span className="text-sm font-medium">Tìm kiếm</span>
          <input
            className="mt-1 w-full px-3 py-2 border rounded-lg"
            placeholder="tiêu đề / theory_id…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onFilter()}
          />
        </label>
        <button
          className="px-3 py-2 rounded-lg border hover:bg-gray-50"
          onClick={onFilter}
          disabled={loading}
        >
          {loading ? "Đang tải…" : "Lọc"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[840px] w-full text-sm border rounded-xl">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Tiêu đề</th>
              <th className="p-3 text-left">theory_id</th>
              <th className="p-3">Level</th>
              <th className="p-3">Diff</th>
              <th className="p-3">Status</th>
              <th className="p-3 w-56">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id || it.theory_id} className="border-t">
                <td className="p-3">{it.title}</td>
                <td className="p-3 font-mono text-xs">{it.theory_id}</td>
                <td className="p-3 text-center">{it.level}</td>
                <td className="p-3 text-center">{it.difficulty}</td>
                <td className="p-3 text-center">
                  <span className="px-2 py-0.5 rounded-full bg-gray-100">
                    {it.status || "draft"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      className="px-2 py-1 border rounded hover:bg-gray-50"
                      onClick={() => onEdit(it.theory_id)}
                    >
                      Sửa
                    </button>
                    <button
                      className="px-2 py-1 border rounded text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(it.theory_id)}
                    >
                      Xoá
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  Không có bài nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ===== EDIT ===== */
function EditPanel({
  item,
  setItem,
  toc,
  loading,
  onSaveDraft,
  onPublish,
  onLoad,
}) {
  const blocks = item.contentBlocks?.blocks || [];
  const [loadId, setLoadId] = useState("");

  function update(k, v) {
    setItem((a) => ({ ...a, [k]: v }));
  }
  function setBlocks(next) {
    setItem((a) => ({ ...a, contentBlocks: { blocks: next } }));
  }

  /* block ops */
  function addBlock(type) {
    setBlocks([...blocks, { type, props: clonePreset(type) }]);
  }
  function updateBlock(idx, props) {
    const next = [...blocks];
    next[idx] = { ...next[idx], props };
    setBlocks(next);
  }
  function moveBlock(from, to) {
    const arr = [...blocks];
    if (to < 0 || to >= arr.length) return;
    const [it] = arr.splice(from, 1);
    arr.splice(to, 0, it);
    setBlocks(arr);
  }
  function removeBlock(idx) {
    setBlocks(blocks.filter((_, i) => i !== idx));
  }

  return (
    <>
      {/* META */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <label className="block">
          <span className="text-sm font-medium">theory_id</span>
          <div className="flex gap-2 mt-1">
            <input
              className="flex-1 px-3 py-2 border rounded-lg"
              value={item.theory_id || ""}
              onChange={(e) => update("theory_id", e.target.value)}
              placeholder="ví dụ: t545"
            />
            <input
              className="px-3 py-2 border rounded-lg"
              placeholder="nạp theo id…"
              value={loadId}
              onChange={(e) => setLoadId(e.target.value)}
            />
            <button
              className="px-3 py-2 rounded-lg border hover:bg-gray-50"
              onClick={() => onLoad(loadId || item.theory_id)}
              disabled={loading}
            >
              {loading ? "Đang nạp…" : "Nạp"}
            </button>
          </div>
        </label>
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          <Field label="Tiêu đề">
            <input
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              value={item.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </Field>
          <Field label="Status">
            <select
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              value={item.status || "draft"}
              onChange={(e) => update("status", e.target.value)}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </Field>
          <Field label="Level">
            <select
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              value={item.level}
              onChange={(e) => update("level", e.target.value)}
            >
              <option value="beginner">beginner</option>
              <option value="intermediate">intermediate</option>
              <option value="advanced">advanced</option>
            </select>
          </Field>
          <Field label="Difficulty (1..5)">
            <input
              type="number"
              min={1}
              max={5}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              value={item.difficulty}
              onChange={(e) =>
                update("difficulty", Number(e.target.value) || 1)
              }
            />
          </Field>
          <Field label="Tags (ngăn cách dấu phẩy)" full>
            <input
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              value={(item.tags || []).join(", ")}
              onChange={(e) => update("tags", splitCSV(e.target.value))}
            />
          </Field>
          <Field label="Skills (ngăn cách dấu phẩy)" full>
            <input
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              value={(item.skills || []).join(", ")}
              onChange={(e) => update("skills", splitCSV(e.target.value))}
            />
          </Field>
          <Field label="Tóm tắt" full>
            <textarea
              rows={2}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              value={item.summary}
              onChange={(e) => update("summary", e.target.value)}
            />
          </Field>
          <Field label="Content URL" full>
            <input
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              value={item.contentUrl}
              onChange={(e) => update("contentUrl", e.target.value)}
              placeholder="https://..."
            />
          </Field>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <button
          className="px-3 py-2 rounded-lg border hover:bg-gray-50"
          onClick={onSaveDraft}
          disabled={loading}
        >
          Lưu nháp
        </button>
        <button
          className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
          onClick={onPublish}
          disabled={loading}
        >
          Xuất bản
        </button>
      </div>

      {/* BUILDER + PREVIEW */}
      <div className="grid lg:grid-cols-[1fr,380px] gap-6">
        {/* BUILDER */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Blocks</h2>
            <AddBlockMenu onPick={(t) => addBlock(t)} />
          </div>

          <div className="space-y-3">
            {blocks.map((blk, i) => (
              <div
                key={i}
                className="border rounded-2xl p-4 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">
                    {i + 1}. <span className="uppercase">{blk.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 text-sm border rounded-lg"
                      onClick={() => moveBlock(i, i - 1)}
                    >
                      ↑
                    </button>
                    <button
                      className="px-2 py-1 text-sm border rounded-lg"
                      onClick={() => moveBlock(i, i + 1)}
                    >
                      ↓
                    </button>
                    <button
                      className="px-2 py-1 text-sm border rounded-lg text-red-600"
                      onClick={() => removeBlock(i)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <BlockEditor
                    block={blk}
                    onChange={(val) => updateBlock(i, val)}
                  />
                </div>
              </div>
            ))}
            {!blocks.length && (
              <div className="p-6 border border-dashed rounded-2xl text-gray-500 text-sm">
                Chưa có block nào. Nhấn <b>+ Thêm block</b> để bắt đầu.
              </div>
            )}
          </div>
        </section>

        {/* PREVIEW */}
        <aside>
          <div className="border rounded-2xl overflow-hidden">
            <div className="grid md:grid-cols-[160px,1fr]">
              <div className="bg-gray-50 p-3">
                <div className="text-sm font-medium mb-2">Mục lục</div>
                <ul className="space-y-1">
                  {toc.map((t) => (
                    <li key={t.id}>
                      <span
                        className="text-sm block"
                        style={{ paddingLeft: (t.level - 2) * 12 }}
                      >
                        {t.text}
                      </span>
                    </li>
                  ))}
                  {!toc.length && (
                    <li className="text-xs text-gray-400">
                      — Chưa có heading —
                    </li>
                  )}
                </ul>
              </div>
              <div className="p-4 prose max-w-none">
                {(item.contentBlocks?.blocks || []).map((b, i) => (
                  <BlockPreview key={i} block={b} idx={i} />
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

/* ===== Small UI ===== */
function Field({ label, full, children }) {
  return (
    <label className={cx("block", full && "col-span-2")}>
      <div className="text-sm font-medium">{label}</div>
      {children}
    </label>
  );
}
function AddBlockMenu({ onPick }) {
  const [open, setOpen] = useState(false);
  const types = [
    "heading",
    "paragraph",
    "list",
    "image",
    "chord",
    "code",
    "callout",
    "quote",
    "divider",
    "columns",
  ];
  return (
    <div className="relative">
      <button
        className="px-3 py-2 rounded-lg border hover:bg-gray-50"
        onClick={() => setOpen((v) => !v)}
      >
        + Thêm block
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg z-10">
          {types.map((t) => (
            <button
              key={t}
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
              onClick={() => {
                onPick(t);
                setOpen(false);
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function BlockEditor({ block, onChange }) {
  const t = block.type,
    p = block.props || {};
  if (t === "heading") return <HeadingForm value={p} onChange={onChange} />;
  if (t === "paragraph") return <ParagraphForm value={p} onChange={onChange} />;
  if (t === "list") return <ListForm value={p} onChange={onChange} />;
  if (t === "image") return <ImageForm value={p} onChange={onChange} />;
  if (t === "chord") return <ChordForm value={p} onChange={onChange} />;
  if (t === "code") return <CodeForm value={p} onChange={onChange} />;
  if (t === "callout") return <CalloutForm value={p} onChange={onChange} />;
  if (t === "quote") return <QuoteForm value={p} onChange={onChange} />;
  if (t === "divider")
    return <div className="text-sm text-gray-500">(Divider)</div>;
  if (t === "columns") return <ColumnsForm value={p} onChange={onChange} />;
  return null;
}

/* ===== Block Forms ===== */
function HeadingForm({ value, onChange }) {
  return (
    <div className="grid md:grid-cols-4 gap-3">
      <label className="block">
        <span className="text-sm">Level</span>
        <select
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.level ?? 2}
          onChange={(e) =>
            onChange({ ...value, level: parseInt(e.target.value, 10) || 2 })
          }
        >
          <option value={1}>h1</option>
          <option value={2}>h2</option>
          <option value={3}>h3</option>
          <option value={4}>h4</option>
        </select>
      </label>
      <label className="block md:col-span-3">
        <span className="text-sm">Text</span>
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.text || ""}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          placeholder="Tiêu đề"
        />
      </label>
    </div>
  );
}
function ParagraphForm({ value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm">Đoạn văn</span>
      <textarea
        className="mt-1 w-full px-3 py-2 border rounded-lg"
        rows={3}
        value={value.text || ""}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
      />
    </label>
  );
}
function ListForm({ value, onChange }) {
  const [raw, setRaw] = useState(() =>
    (value.items || [])
      .map((x) => (typeof x === "string" ? x : x.text))
      .join("\n")
  );
  useEffect(() => {
    const items = String(raw || "")
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({ ...value, items, ordered: !!value.ordered });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);
  return (
    <div className="grid md:grid-cols-4 gap-3">
      <label className="block md:col-span-3">
        <span className="text-sm">Các dòng (mỗi dòng 1 mục)</span>
        <textarea
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          rows={4}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm">Loại</span>
        <select
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.ordered ? "ordered" : "unordered"}
          onChange={(e) =>
            onChange({ ...value, ordered: e.target.value === "ordered" })
          }
        >
          <option value="unordered">Unordered (•)</option>
          <option value="ordered">Ordered (1.)</option>
        </select>
      </label>
    </div>
  );
}
function ImageForm({ value, onChange }) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <label className="block md:col-span-2">
        <span className="text-sm">Ảnh (URL)</span>
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.src || ""}
          onChange={(e) => onChange({ ...value, src: e.target.value })}
          placeholder="https://..."
        />
      </label>
      <label className="block">
        <span className="text-sm">Alt</span>
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.alt || ""}
          onChange={(e) => onChange({ ...value, alt: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="text-sm">Caption</span>
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.caption || ""}
          onChange={(e) => onChange({ ...value, caption: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="text-sm">Width</span>
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.width || "100%"}
          onChange={(e) => onChange({ ...value, width: e.target.value })}
        />
      </label>
    </div>
  );
}
function ChordForm({ value, onChange }) {
  const [strings, setStrings] = useState(() => (value.strings || []).join(","));
  const [fingers, setFingers] = useState(() => (value.fingers || []).join(","));
  useEffect(() => {
    const parseStrings = String(strings || "")
      .split(",")
      .map((s) => s.trim())
      .map((s) => (s === "x" ? "x" : Number(s)));
    const parseFingers = String(fingers || "")
      .split(",")
      .map((s) => s.trim())
      .map((s) => (s ? Number(s) : null));
    onChange({ ...value, strings: parseStrings, fingers: parseFingers });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strings, fingers]);
  return (
    <div className="grid md:grid-cols-3 gap-3">
      <Field label="Tên hợp âm">
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.name || ""}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </Field>
      <Field label="Start fret">
        <input
          type="number"
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.startFret ?? 1}
          onChange={(e) =>
            onChange({ ...value, startFret: parseInt(e.target.value, 10) || 1 })
          }
        />
      </Field>
      <div />
      <Field label="Strings (x,3,2,0,1,0)">
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={strings}
          onChange={(e) => setStrings(e.target.value)}
        />
      </Field>
      <Field label="Fingers (-,3,2,-,1,-)">
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={fingers}
          onChange={(e) => setFingers(e.target.value)}
        />
      </Field>
    </div>
  );
}
function CodeForm({ value, onChange }) {
  return (
    <div className="grid md:grid-cols-3 gap-3">
      <Field label="Ngôn ngữ (ghi chú)">
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.language || ""}
          onChange={(e) => onChange({ ...value, language: e.target.value })}
          placeholder="javascript, typescript... (preview là plain text)"
        />
      </Field>
      <label className="block md:col-span-2">
        <span className="text-sm">Code</span>
        <textarea
          className="mt-1 w-full px-3 py-2 border rounded-lg font-mono"
          rows={6}
          value={value.code || ""}
          onChange={(e) => onChange({ ...value, code: e.target.value })}
        />
      </label>
    </div>
  );
}
function CalloutForm({ value, onChange }) {
  return (
    <div className="grid md:grid-cols-3 gap-3">
      <Field label="Tone">
        <select
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.tone || "info"}
          onChange={(e) => onChange({ ...value, tone: e.target.value })}
        >
          {tones.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Nội dung">
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.text || ""}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
        />
      </Field>
      <Field label="Tiêu đề (tùy chọn)">
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.title || ""}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </Field>
    </div>
  );
}
function QuoteForm({ value, onChange }) {
  return (
    <div className="grid md:grid-cols-3 gap-3">
      <label className="block md:col-span-2">
        <span className="text-sm">Trích dẫn</span>
        <textarea
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          rows={3}
          value={value.text || ""}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
        />
      </label>
      <Field label="Nguồn (cite)">
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.cite || ""}
          onChange={(e) => onChange({ ...value, cite: e.target.value })}
        />
      </Field>
    </div>
  );
}
function ColumnsForm({ value, onChange }) {
  const columns = (value && value.columns) || [[], []];
  function add(colIdx, type) {
    const next = columns.map((c, i) =>
      i === colIdx ? [...c, { type, props: clonePreset(type) }] : c
    );
    onChange({ ...value, columns: next });
  }
  function edit(colIdx, idx, props) {
    const next = columns.map((c, i) =>
      i === colIdx ? c.map((b, j) => (j === idx ? { ...b, props } : b)) : c
    );
    onChange({ ...value, columns: next });
  }
  function remove(colIdx, idx) {
    const next = columns.map((c, i) =>
      i === colIdx ? c.filter((_, j) => j !== idx) : c
    );
    onChange({ ...value, columns: next });
  }
  function move(colIdx, from, to) {
    const next = columns.map((c, i) => {
      if (i !== colIdx) return c;
      const arr = [...c];
      if (to < 0 || to >= arr.length) return arr;
      const [it] = arr.splice(from, 1);
      arr.splice(to, 0, it);
      return arr;
    });
    onChange({ ...value, columns: next });
  }
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {columns.map((col, cIdx) => (
        <div key={cIdx} className="border rounded-xl p-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Cột {cIdx + 1}</div>
            <AddBlockMenu onPick={(t) => add(cIdx, t)} />
          </div>
          <div className="space-y-3">
            {col.map((b, i) => (
              <div key={i} className="border rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">
                    {i + 1}. {b.type}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 text-sm border rounded"
                      onClick={() => move(cIdx, i, i - 1)}
                    >
                      ↑
                    </button>
                    <button
                      className="px-2 py-1 text-sm border rounded"
                      onClick={() => move(cIdx, i, i + 1)}
                    >
                      ↓
                    </button>
                    <button
                      className="px-2 py-1 text-sm border rounded text-red-600"
                      onClick={() => remove(cIdx, i)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <BlockEditor
                    block={b}
                    onChange={(props) => edit(cIdx, i, props)}
                  />
                </div>
              </div>
            ))}
            {!col.length && (
              <div className="text-sm text-gray-500">(Trống)</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===== Preview Renderer ===== */
function BlockPreview({ block, idx }) {
  const { type: t, props: d = {} } = block;
  if (t === "paragraph") return <p>{d.text}</p>;
  if (t === "heading") {
    const Tag = `h${Math.min(6, Math.max(1, d.level || 2))}`;
    return <Tag id={`h-${d.level || 2}-${idx}`}>{d.text}</Tag>;
  }
  if (t === "list")
    return d.ordered ? (
      <ol>
        {(d.items || []).map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ol>
    ) : (
      <ul>
        {(d.items || []).map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    );
  if (t === "image")
    return (
      <figure>
        {d.src && (
          <img
            src={d.src}
            alt={d.alt || ""}
            style={{ width: d.width || "100%" }}
          />
        )}
        {(d.caption || d.alt) && (
          <figcaption className="text-sm opacity-70">
            {d.caption || d.alt}
          </figcaption>
        )}
      </figure>
    );
  if (t === "callout") {
    const toneClass = {
      info: "bg-blue-50 text-blue-800 border-blue-200",
      success: "bg-emerald-50 text-emerald-800 border-emerald-200",
      warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
      danger: "bg-red-50 text-red-800 border-red-200",
    }[d.tone || "info"];
    return (
      <div className={cx("px-3 py-2 border rounded-lg", toneClass)}>
        {d.title && <div className="font-semibold">{d.title}</div>}
        <div>{d.text}</div>
      </div>
    );
  }
  if (t === "quote")
    return (
      <blockquote>
        <div>{d.text}</div>
        {d.cite && <cite className="block opacity-70">— {d.cite}</cite>}
      </blockquote>
    );
  if (t === "code")
    return (
      <pre className="rounded-xl bg-gray-900 text-white p-3 overflow-auto">
        <code>{d.code || ""}</code>
      </pre>
    );
  if (t === "divider") return <hr />;
  if (t === "columns") {
    const cols = (d.columns || []).length || 1;
    return (
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {(d.columns || []).map((col, i) => (
          <div key={i} className="min-w-0">
            {col.map((b, j) => (
              <BlockPreview key={j} block={b} idx={`${idx}-${i}-${j}`} />
            ))}
          </div>
        ))}
      </div>
    );
  }
  if (t === "chord") {
    return (
      <div className="rounded-lg border p-3">
        <div className="font-semibold mb-1">
          Chord: {d.name || "(chưa đặt tên)"}
        </div>
        <div className="text-xs opacity-75">
          startFret: {d.startFret ?? 1} • strings:{" "}
          {(d.strings || []).join(", ")} • fingers:{" "}
          {(d.fingers || []).map((x) => (x === null ? "-" : x)).join(", ")}
        </div>
      </div>
    );
  }
  return null;
}

/* ===== Utils ===== */
function splitCSV(s) {
  return String(s || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}
function clonePreset(type) {
  const base = BASE_BLOCKS[type];
  return JSON.parse(JSON.stringify(base || {}));
}
function normalizeBlocks(arr) {
  return (arr || []).map((b) =>
    b?.props ? b : { ...b, props: b?.data || {} }
  );
}
function sanitizeBlock(b) {
  if (!b || typeof b !== "object") return b;
  const { type, props } = b;
  const clean = { type, props: {} };
  Object.keys(props || {}).forEach((k) => {
    const v = props[k];
    if (v !== undefined) clean.props[k] = v;
  });
  return clean;
}
