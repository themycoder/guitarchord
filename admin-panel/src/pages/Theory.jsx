import React, { useEffect, useState } from "react";



const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_API_BASE) ||
  "http://localhost:3000/api";

const cx = (...a) => a.filter(Boolean).join(" ");
const tones = ["info", "success", "warning", "danger"];

function slugify(input) {
  return (input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);
}

export default function Theory() {
  const [article, setArticle] = useState({
    title: "",
    slug: "",
    excerpt: "",
    cover: "",
    tags: [],
    status: "draft",
    blocks: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [loadSlug, setLoadSlug] = useState("");
  const EMPTY = { title:"", slug:"", excerpt:"", cover:"", tags:[], status:"draft", blocks:[] };
const [tab, setTab] = useState("list"); // "list" | "edit"

  function update(key, value) {
    setArticle((a) => ({ ...a, [key]: value }));
  }
function newArticle() {
  setArticle(EMPTY);
  setLoadSlug("");
  setTab("edit");
}
  function addBlock(type) {
    const empty = {
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
    setArticle((a) => ({
      ...a,
      blocks: [...a.blocks, { type, props: empty[type] }],
    }));
  }

  function moveBlock(from, to) {
    setArticle((a) => {
      const arr = [...a.blocks];
      if (to < 0 || to >= arr.length) return a;
      const [it] = arr.splice(from, 1);
      arr.splice(to, 0, it);
      return { ...a, blocks: arr };
    });
  }

  function removeBlock(idx) {
    setArticle((a) => ({ ...a, blocks: a.blocks.filter((_, i) => i !== idx) }));
  }

  function handleDragStart(i) {
    setDragIndex(i);
  }
  function handleDragOver(e, i) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
  function handleDrop(i) {
    if (dragIndex === null || dragIndex === i) return;
    moveBlock(dragIndex, i);
    setDragIndex(null);
  }

  async function existsBySlug(slug) {
    if (!slug) return false;
    try {
      const res = await fetch(`${API_BASE}/theory/${encodeURIComponent(slug)}`);
      return res.ok;
    } catch {
      return false;
    }
  }
async function loadBySlugParam(slug) {
  setLoading(true);
  setError(null);
  setMessage(null);
  try {
    const res = await fetch(`${API_BASE}/theory/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error("Không tìm thấy bài với slug đó.");
    const json = await res.json();
    setArticle(json.data);
    setMessage("Đã nạp bài để chỉnh sửa.");
    setTab("edit");
  } catch (e) {
    setError(String(e.message || e));
  } finally {
    setLoading(false);
    setTimeout(() => setMessage(null), 2500);
  }
}
  async function save(publish = false) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        ...article,
        status: publish ? "published" : article.status,
      };
      const method =
        article._id || (await existsBySlug(article.slug)) ? "PATCH" : "POST";
      const url =
        method === "POST"
          ? `${API_BASE}/theory`
          : `${API_BASE}/theory/${encodeURIComponent(article.slug)}`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`${method} failed: HTTP ${res.status}`);
      const json = await res.json();
      setArticle(json.data);
      setMessage(
        method === "POST" ? "Đã tạo bài thành công." : "Đã lưu cập nhật."
      );
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 2500);
    }
  }

  async function loadBySlug() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const slug = loadSlug || article.slug;
      const res = await fetch(`${API_BASE}/theory/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error(`Không tìm thấy bài với slug đó.`);
      const json = await res.json();
      setArticle(json.data);
      setMessage("Đã nạp bài để chỉnh sửa.");
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 2500);
    }
  }

  useEffect(() => {
    if (!article.slug && article.title) {
      setArticle((a) => ({ ...a, slug: slugify(a.title) }));
    }
  }, [article.title]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        <header className="mb-6">
          {/* Nav tabs */}
          <nav className="mb-4 flex items-center gap-2">
            <button
              onClick={() => setTab("list")}
              className={`px-3 py-2 rounded-lg border ${
                tab === "list"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "hover:bg-gray-50"
              }`}
            >
              Danh sách bài
            </button>
            <button
              onClick={newArticle}
              className={`px-3 py-2 rounded-lg border ${
                tab === "edit" && !article?._id && !article?.slug
                  ? "bg-gray-900 text-white border-gray-900"
                  : "hover:bg-gray-50"
              }`}
            >
              Thêm bài mới
            </button>
            {article?.slug && (
              <button
                onClick={() => setTab("edit")}
                className={`px-3 py-2 rounded-lg border ${
                  tab === "edit" && article?.slug
                    ? "bg-gray-900 text-white border-gray-900"
                    : "hover:bg-gray-50"
                }`}
                title="Chỉnh sửa bài đang mở"
              >
                Sửa: {article.slug}
              </button>
            )}
          </nav>

          {/* Action bar chỉ hiện ở tab edit */}
          {tab === "edit" && (
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-bold">
                Admin: Theory Editor
              </h1>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-2 rounded-lg border hover:bg-gray-50"
                  onClick={() =>
                    setArticle((a) => ({
                      ...a,
                      slug: a.slug || slugify(a.title),
                    }))
                  }
                >
                  Tạo slug
                </button>
                <button
                  className={`px-3 py-2 rounded-lg border ${
                    saving && "opacity-60 cursor-not-allowed"
                  }`}
                  onClick={() => save(false)}
                  disabled={saving}
                >
                  Lưu nháp
                </button>
                <button
                  className={`px-3 py-2 rounded-lg bg-emerald-600 text-white ${
                    saving && "opacity-60 cursor-not-allowed"
                  }`}
                  onClick={() => save(true)}
                  disabled={saving}
                >
                  Xuất bản
                </button>
              </div>
            </div>
          )}
        </header>

        {/* === HIỂN THỊ THEO TAB === */}
        {tab === "list" ? (
          <ListPanel onCreate={newArticle} onEdit={loadBySlugParam} />
        ) : (
          <>
            {(message || error) && (
              <div className="mb-4">
                {message && (
                  <div className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {message}
                  </div>
                )}
                {error && (
                  <div className="px-3 py-2 rounded-lg bg-red-50 text-red-800 border border-red-200">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Meta form */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium">Tiêu đề</span>
                  <input
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    value={article.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="Ví dụ: Triads 101"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Slug</span>
                  <input
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    value={article.slug}
                    onChange={(e) => update("slug", e.target.value)}
                    placeholder="triads-101-guitar"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">
                    Excerpt (tóm tắt ngắn)
                  </span>
                  <textarea
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    value={article.excerpt || ""}
                    onChange={(e) => update("excerpt", e.target.value)}
                  />
                </label>
              </div>
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium">Ảnh cover (URL)</span>
                  <input
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    value={article.cover || ""}
                    onChange={(e) => update("cover", e.target.value)}
                    placeholder="https://..."
                  />
                </label>
                <TagInput
                  value={article.tags}
                  onChange={(v) => update("tags", v)}
                />
                <div className="flex items-center gap-3">
                  <label className="block flex-1">
                    <span className="text-sm font-medium">Trạng thái</span>
                    <select
                      className="mt-1 w-full px-3 py-2 border rounded-lg"
                      value={article.status}
                      onChange={(e) => update("status", e.target.value)}
                    >
                      <option value="draft">draft</option>
                      <option value="published">published</option>
                      <option value="archived">archived</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">
                      Tải bài theo slug
                    </span>
                    <div className="flex gap-2 mt-1">
                      <input
                        className="px-3 py-2 border rounded-lg"
                        placeholder="slug cần nạp"
                        value={loadSlug}
                        onChange={(e) => setLoadSlug(e.target.value)}
                      />
                      <button
                        className="px-3 py-2 rounded-lg border hover:bg-gray-50"
                        onClick={loadBySlug}
                        disabled={loading}
                      >
                        {loading ? "Đang nạp..." : "Nạp"}
                      </button>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Blocks builder */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Blocks</h2>
                <AddBlockMenu onPick={addBlock} />
              </div>
              <div className="space-y-3">
                {article.blocks.map((blk, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={() => {
                      if (dragIndex === null || dragIndex === i) return;
                      moveBlock(dragIndex, i);
                      setDragIndex(null);
                    }}
                    className={cx(
                      "border rounded-2xl p-4 bg-white shadow-sm",
                      dragIndex === i && "ring-2 ring-emerald-300"
                    )}
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
                        onChange={(val) => {
                          setArticle((a) => {
                            const arr = [...a.blocks];
                            arr[i] = { ...arr[i], props: val };
                            return { ...a, blocks: arr };
                          });
                        }}
                      />
                    </div>
                  </div>
                ))}
                {article.blocks.length === 0 && (
                  <div className="p-6 border border-dashed rounded-2xl text-gray-500 text-sm">
                    Chưa có block nào. Nhấn{" "}
                    <span className="font-semibold">+ Thêm block</span> để bắt
                    đầu.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
        {/* === /END TAB === */}
      </div>
    </div>
  );

}

function TagInput({ value, onChange }) {
  const [input, setInput] = useState("");
  function add(tag) {
    const t = String(tag || "").trim();
    if (!t) return;
    if (value.includes(t)) return;
    onChange([...(value || []), t]);
  }
  function remove(tag) {
    onChange((value || []).filter((x) => x !== tag));
  }
  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
      setInput("");
    }
    if (e.key === "Backspace" && !input && (value || []).length) {
      onChange(value.slice(0, -1));
    }
  }
  return (
    <div>
      <div className="text-sm font-medium">Tags</div>
      <div className="mt-1 flex flex-wrap gap-2 border rounded-lg p-2">
        {(value || []).map((t) => (
          <span
            key={t}
            className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs inline-flex items-center gap-1"
          >
            #{t}
            <button
              className="text-gray-400 hover:text-gray-700"
              onClick={() => remove(t)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="flex-1 min-w-[120px] outline-none"
          placeholder="nhập tag, Enter để thêm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
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
  const t = block.type;
  const p = block.props || {};
  if (t === "heading") return <HeadingForm value={p} onChange={onChange} />;
  if (t === "paragraph") return <ParagraphForm value={p} onChange={onChange} />;
  if (t === "list") return <ListForm value={p} onChange={onChange} />;
  if (t === "image") return <ImageForm value={p} onChange={onChange} />;
  if (t === "chord") return <ChordForm value={p} onChange={onChange} />;
  if (t === "code") return <CodeForm value={p} onChange={onChange} />;
  if (t === "callout") return <CalloutForm value={p} onChange={onChange} />;
  if (t === "quote") return <QuoteForm value={p} onChange={onChange} />;
  if (t === "divider")
    return (
      <div className="text-sm text-gray-500">(Divider – không có cài đặt)</div>
    );
  if (t === "columns") return <ColumnsForm value={p} onChange={onChange} />;
  return null;
}

function HeadingForm({ value, onChange }) {
  return (
    <div className="grid md:grid-cols-4 gap-3">
      <label className="block">
        <span className="text-sm">Level</span>
        <select
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.level ?? 2}
          onChange={(e) =>
            onChange({ ...value, level: parseInt(e.target.value, 10) })
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
      <label className="block">
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
      <label className="block">
        <span className="text-sm">Tên hợp âm</span>
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.name || ""}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="text-sm">Start fret</span>
        <input
          type="number"
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.startFret ?? 1}
          onChange={(e) =>
            onChange({ ...value, startFret: parseInt(e.target.value, 10) || 1 })
          }
        />
      </label>
      <div />
      <label className="block md:col-span-2">
        <span className="text-sm">Strings (6 giá trị, ví dụ: x,3,2,0,1,0)</span>
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={strings}
          onChange={(e) => setStrings(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm">Fingers (ví dụ: -,3,2,-,1,-)</span>
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={fingers}
          onChange={(e) => setFingers(e.target.value)}
        />
      </label>
    </div>
  );
}

function CodeForm({ value, onChange }) {
  return (
    <div className="grid md:grid-cols-3 gap-3">
      <label className="block">
        <span className="text-sm">Ngôn ngữ</span>
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.language || ""}
          onChange={(e) => onChange({ ...value, language: e.target.value })}
          placeholder="javascript, typescript, ..."
        />
      </label>
      <label className="block md:col-span-2">
        <span className="text-sm">Code</span>
        <textarea
          className="mt-1 w-full px-3 py-2 border rounded-lg font-mono"
          rows={4}
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
      <label className="block">
        <span className="text-sm">Tone</span>
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
      </label>
      <label className="block md:col-span-2">
        <span className="text-sm">Nội dung</span>
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.text || ""}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
        />
      </label>
      <label className="block md:col-span-3">
        <span className="text-sm">Tiêu đề (tùy chọn)</span>
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.title || ""}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </label>
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
      <label className="block">
        <span className="text-sm">Nguồn (cite)</span>
        <input
          className="mt-1 w-full px-3 py-2 border rounded-lg"
          value={value.cite || ""}
          onChange={(e) => onChange({ ...value, cite: e.target.value })}
        />
      </label>
    </div>
  );
}

function ColumnsForm({ value, onChange }) {
  const columns = (value && value.columns) || [[], []];
  function add(colIdx, type) {
    const base = {
      heading: { level: 3, text: "" },
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
    const next = columns.map((c, idx) =>
      idx === colIdx ? [...c, { type, props: base[type] }] : c
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
        <div key={cIdx} className="border rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Cột {cIdx + 1}</div>
            <AddBlockMenu onPick={(t) => add(cIdx, t)} />
          </div>
          <div className="space-y-3">
            {col.map((b, i) => (
              <div key={i} className="border rounded-xl p-3 bg-white">
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
            {col.length === 0 && (
              <div className="text-sm text-gray-500">(Trống)</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
function ListPanel({ onCreate, onEdit }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100", sort: "newest" });
      if (q) params.set("q", q);
      if (status !== "all") params.set("status", status);
      const res = await fetch(`${API_BASE}/theory?${params.toString()}`);
      const json = await res.json();
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-sm font-medium">Tìm kiếm</label>
          <input
            className="mt-1 w-full px-3 py-2 border rounded-lg"
            placeholder="tiêu đề hoặc slug…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Trạng thái</label>
          <select
            className="mt-1 px-3 py-2 border rounded-lg"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </div>
        <button
          className="px-3 py-2 rounded-lg border hover:bg-gray-50"
          onClick={load}
        >
          {loading ? "Đang tải…" : "Lọc"}
        </button>
        <div className="flex-1" />
        <button
          className="px-3 py-2 rounded-lg bg-gray-900 text-white"
          onClick={onCreate}
        >
          + Thêm bài mới
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full text-sm border rounded-xl">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Tiêu đề</th>
              <th className="p-3 text-left">Slug</th>
              <th className="p-3">Status</th>
              <th className="p-3">Tags</th>
              <th className="p-3 w-48">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id || it.slug} className="border-t">
                <td className="p-3">{it.title}</td>
                <td className="p-3 font-mono text-xs">{it.slug}</td>
                <td className="p-3 text-center">
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {it.status}
                  </span>
                </td>
                <td className="p-3">
                  {(it.tags || [])
                    .slice(0, 4)
                    .map((t) => `#${t}`)
                    .join(" ")}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2 justify-end">
                    
                    <button
                      className="px-2 py-1 border rounded hover:bg-gray-50"
                      onClick={() => onEdit(it.slug)}
                    >
                      Sửa
                    </button>
                    <DeleteBtn slug={it.slug} onDone={load} />
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={5}>
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

function DeleteBtn({ slug, onDone }) {
  const [busy, setBusy] = useState(false);
  async function del() {
    if (!confirm(`Xoá bài: ${slug}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${API_BASE}/theory/${encodeURIComponent(slug)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Delete failed");
      onDone?.();
    } catch (e) {
      alert("Không xoá được: " + (e.message || e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      className="px-2 py-1 border rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
      onClick={del}
      disabled={busy}
    >
      Xoá
    </button>
  );
}
