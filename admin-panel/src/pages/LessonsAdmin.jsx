import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/api";

/** ----------------------------------------------
 *  Small helpers
 *  ---------------------------------------------- */
function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Icon({ name, className = "w-4 h-4" }) {
  const map = {
    heading: (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6 4v16M18 4v16M6 12h12" />
      </svg>
    ),
    text: (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 6h16M4 12h10M4 18h16" />
      </svg>
    ),
    image: (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m8 13 3-3 4 4" />
        <circle cx="8" cy="8" r="1" />
      </svg>
    ),
    list: (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M8 6h13M8 12h13M8 18h13" />
        <path d="M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
    quote: (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6 7h6v6H8a2 2 0 0 1-2-2zm10 0h6v6h-4a2 2 0 0 1-2-2z" />
      </svg>
    ),
    tip: (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.3 4.7 3.3 6L8 17v3h8v-3l-.3-2A7 7 0 0 0 12 2Z" />
      </svg>
    ),
    code: (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m16 18 6-6-6-6" />
        <path d="m8 6-6 6 6 6" />
      </svg>
    ),
    video: (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="5" width="15" height="14" rx="2" />
        <path d="m18 8 4-2v12l-4-2z" />
      </svg>
    ),
    move: (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2v20M2 12h20M19 5l-7-3-7 3m14 14-7 3-7-3" />
      </svg>
    ),
    trash: (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      </svg>
    ),
    duplicate: (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <rect x="2" y="2" width="13" height="13" rx="2" />
      </svg>
    ),
    collapse: (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m7 15 5-5 5 5" />
      </svg>
    ),
    expand: (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m7 9 5 5 5-5" />
      </svg>
    ),
  };
  return map[name] || null;
}

/** ----------------------------------------------
 *  Block Editors
 *  ---------------------------------------------- */
const BLOCK_TEMPLATES = {
  heading: { type: "heading", level: 2, text: "" },
  paragraph: { type: "paragraph", text: "" },
  image: { type: "image", url: "", caption: "" },
  list: { type: "list", style: "bullet", items: [""] },
  quote: { type: "quote", text: "", cite: "" },
  tip: { type: "tip", variant: "info", text: "" },
  code: { type: "code", language: "", content: "" },
  video: { type: "video", url: "" },
};

function BlockToolbar({
  idx,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  collapsed,
  onToggle,
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        className="p-1 rounded hover:bg-gray-100"
        title="Move up"
        onClick={onMoveUp}
      >
        <Icon name="move" />
      </button>
      <button
        className="p-1 rounded hover:bg-gray-100"
        title="Move down"
        onClick={onMoveDown}
      >
        <Icon name="move" />
      </button>
      <button
        className="p-1 rounded hover:bg-gray-100"
        title="Duplicate"
        onClick={onDuplicate}
      >
        <Icon name="duplicate" />
      </button>
      <button
        className="p-1 rounded hover:bg-gray-100"
        title={collapsed ? "Expand" : "Collapse"}
        onClick={onToggle}
      >
        <Icon name={collapsed ? "expand" : "collapse"} />
      </button>
      <button
        className="p-1 rounded hover:bg-red-50 text-red-600"
        title="Delete"
        onClick={onDelete}
      >
        <Icon name="trash" />
      </button>
    </div>
  );
}

function HeadingBlock({ value, onChange }) {
  return (
    <div className="grid grid-cols-5 gap-3">
      <select
        className="border rounded px-2 py-2"
        value={value.level}
        onChange={(e) => onChange({ ...value, level: Number(e.target.value) })}
      >
        {[1, 2, 3, 4].map((n) => (
          <option key={n} value={n}>
            H{n}
          </option>
        ))}
      </select>
      <input
        className="col-span-4 border rounded px-3 py-2"
        placeholder="Heading text"
        value={value.text}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
      />
    </div>
  );
}

function ParagraphBlock({ value, onChange }) {
  return (
    <textarea
      className="w-full border rounded px-3 py-2"
      rows={4}
      placeholder="Paragraph text (markdown supported)"
      value={value.text}
      onChange={(e) => onChange({ ...value, text: e.target.value })}
    />
  );
}

function ImageBlock({ value, onChange }) {
  return (
    <div className="grid grid-cols-5 gap-3">
      <input
        className="col-span-3 border rounded px-3 py-2"
        placeholder="Image URL"
        value={value.url}
        onChange={(e) => onChange({ ...value, url: e.target.value })}
      />
      <input
        className="col-span-2 border rounded px-3 py-2"
        placeholder="Caption (optional)"
        value={value.caption}
        onChange={(e) => onChange({ ...value, caption: e.target.value })}
      />
    </div>
  );
}

function ListBlock({ value, onChange }) {
  const setItem = (i, v) => {
    const items = [...(value.items || [])];
    items[i] = v;
    onChange({ ...value, items });
  };
  const add = () => onChange({ ...value, items: [...(value.items || []), ""] });
  const remove = (i) =>
    onChange({
      ...value,
      items: (value.items || []).filter((_, j) => j !== i),
    });
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Style</label>
        <select
          className="border rounded px-2 py-2"
          value={value.style}
          onChange={(e) => onChange({ ...value, style: e.target.value })}
        >
          <option value="bullet">Bullet</option>
          <option value="number">Number</option>
          <option value="check">Checklist</option>
        </select>
      </div>
      <div className="space-y-2">
        {(value.items || []).map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder={`Item #${i + 1}`}
              value={it}
              onChange={(e) => setItem(i, e.target.value)}
            />
            <button
              className="px-2 py-2 rounded border"
              onClick={() => remove(i)}
            >
              –
            </button>
          </div>
        ))}
        <button className="px-3 py-2 rounded bg-gray-100" onClick={add}>
          + Add Item
        </button>
      </div>
    </div>
  );
}

function QuoteBlock({ value, onChange }) {
  return (
    <div className="grid grid-cols-5 gap-3">
      <textarea
        className="col-span-5 border rounded px-3 py-2"
        rows={3}
        placeholder="Quote text"
        value={value.text}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
      />
      <input
        className="col-span-5 border rounded px-3 py-2"
        placeholder="Citation / Source (optional)"
        value={value.cite}
        onChange={(e) => onChange({ ...value, cite: e.target.value })}
      />
    </div>
  );
}

function TipBlock({ value, onChange }) {
  return (
    <div className="grid grid-cols-5 gap-3">
      <select
        className="border rounded px-2 py-2"
        value={value.variant}
        onChange={(e) => onChange({ ...value, variant: e.target.value })}
      >
        <option value="info">Info</option>
        <option value="warning">Warning</option>
        <option value="success">Success</option>
      </select>
      <textarea
        className="col-span-4 border rounded px-3 py-2"
        rows={3}
        placeholder="Tip content"
        value={value.text}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
      />
    </div>
  );
}

function CodeBlock({ value, onChange }) {
  return (
    <div className="grid grid-cols-5 gap-3">
      <input
        className="border rounded px-3 py-2"
        placeholder="Language (e.g., js, ts, py)"
        value={value.language}
        onChange={(e) => onChange({ ...value, language: e.target.value })}
      />
      <textarea
        className="col-span-4 border rounded px-3 py-2 font-mono text-sm"
        rows={6}
        placeholder="Code"
        value={value.content}
        onChange={(e) => onChange({ ...value, content: e.target.value })}
      />
    </div>
  );
}

function VideoBlock({ value, onChange }) {
  return (
    <input
      className="w-full border rounded px-3 py-2"
      placeholder="Video URL (YouTube, etc.)"
      value={value.url}
      onChange={(e) => onChange({ ...value, url: e.target.value })}
    />
  );
}

function BlockCard({ idx, block, onChange, onMove, onDuplicate, onDelete }) {
  const [collapsed, setCollapsed] = useState(false);
  const type = block?.type || "paragraph";

  const headerIcon = {
    heading: "heading",
    paragraph: "text",
    image: "image",
    list: "list",
    quote: "quote",
    tip: "tip",
    code: "code",
    video: "video",
  }[type];

  const Editor =
    {
      heading: HeadingBlock,
      paragraph: ParagraphBlock,
      image: ImageBlock,
      list: ListBlock,
      quote: QuoteBlock,
      tip: TipBlock,
      code: CodeBlock,
      video: VideoBlock,
    }[type] || ParagraphBlock;

  return (
    <div className="rounded-xl border p-3 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name={headerIcon} className="w-5 h-5" />
          <span className="font-medium capitalize">{type}</span>
        </div>
        <BlockToolbar
          idx={idx}
          onMoveUp={() => onMove(idx, idx - 1)}
          onMoveDown={() => onMove(idx, idx + 1)}
          onDuplicate={() => onDuplicate(idx)}
          onDelete={() => onDelete(idx)}
          collapsed={collapsed}
          onToggle={() => setCollapsed((s) => !s)}
        />
      </div>

      {!collapsed && (
        <div className="mt-3">
          <Editor value={block} onChange={onChange} />
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">Index: {idx}</div>
    </div>
  );
}

function AddBlockBar({ onAdd }) {
  const [type, setType] = useState("paragraph");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="border rounded px-3 py-2"
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <option value="heading">Heading</option>
        <option value="paragraph">Paragraph</option>
        <option value="image">Image</option>
        <option value="list">List</option>
        <option value="quote">Quote</option>
        <option value="tip">Tip / Callout</option>
        <option value="code">Code</option>
        <option value="video">Video</option>
      </select>
      <button
        className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
        onClick={() => onAdd(type)}
      >
        + Add block
      </button>
    </div>
  );
}

function BlockEditor({ value = [], onChange }) {
  const blocks = value || [];

  const setBlock = (i, v) => {
    const arr = [...blocks];
    arr[i] = v;
    onChange(arr);
  };
  const addBlock = (type) => {
    const template = BLOCK_TEMPLATES[type] || BLOCK_TEMPLATES.paragraph;
    onChange([...(blocks || []), { ...template }]);
  };
  const move = (from, to) => {
    if (to < 0 || to >= blocks.length) return;
    const arr = [...blocks];
    const [spliced] = arr.splice(from, 1);
    arr.splice(to, 0, spliced);
    onChange(arr);
  };
  const duplicate = (i) => {
    const arr = [...blocks];
    arr.splice(i + 1, 0, JSON.parse(JSON.stringify(blocks[i])));
    onChange(arr);
  };
  const remove = (i) => onChange(blocks.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <AddBlockBar onAdd={addBlock} />

      {blocks.length === 0 ? (
        <div className="text-sm text-gray-500">
          Chưa có block nào. Thêm block để bắt đầu.
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((b, i) => (
            <BlockCard
              key={i}
              idx={i}
              block={b}
              onChange={(v) => setBlock(i, v)}
              onMove={move}
              onDuplicate={duplicate}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      {/* quick JSON preview for debugging only */}
      <details className="mt-2">
        <summary className="text-sm text-gray-500 cursor-pointer">
          Xem JSON (debug)
        </summary>
        <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
          {JSON.stringify(blocks, null, 2)}
        </pre>
      </details>
    </div>
  );
}

/** ----------------------------------------------
 *  TagsInput (unchanged)
 *  ---------------------------------------------- */
function TagsInput({ value = [], onChange }) {
  const [text, setText] = useState(value.join(", "));
  useEffect(() => {
    setText(value.join(", "));
  }, [value]);
  return (
    <div>
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="intro, posture, rhythm"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const arr = e.target.value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          onChange(arr);
        }}
      />
      <div className="text-xs text-gray-500 mt-1">Ngăn cách bằng dấu phẩy.</div>
    </div>
  );
}

/** ----------------------------------------------
 *  Main Admin Page
 *  ---------------------------------------------- */
export default function LessonsAdmin() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");

  const hasNext = useMemo(() => page * limit < total, [page, limit, total]);

  async function loadList(p = 1) {
    setLoading(true);
    setMsg("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", String(limit));
      if (q.trim()) params.set("q", q.trim());
      if (topic.trim()) params.set("topic", topic.trim());
      if (level.trim()) params.set("level", level.trim());
      params.set("sort", "-createdAt");
      const data = await apiGet(`/api/lesson?${params.toString()}`);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch (e) {
      setMsg(e.message || "Lỗi tải danh sách");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList(1);
  }, []);

  function newLesson() {
    setEditing({
      title: "",
      slug: "",
      topic: "orientation",
      level: 1,
      prereqs: [],
      tags: [],
      summary: "",
      blocks: [],
      resources: [],
      exercises: [],
      coverImage: "",
      videoUrls: [],
      quiz_pool: [],
    });
  }

  async function saveLesson() {
    try {
      setLoading(true);
      setMsg("");
      if (editing._id || editing.id) {
        const id = editing._id || editing.id;
        await apiPut(`/api/lesson/${id}`, editing);
      } else {
        const resp = await apiPost(`/api/lesson`, editing);
        setEditing(resp.lesson);
      }
      await loadList(page);
      setMsg("Đã lưu bài học.");
    } catch (e) {
      setMsg(e.message || "Lỗi lưu bài học");
    } finally {
      setLoading(false);
    }
  }

  async function deleteLesson(id) {
    if (!confirm("Xoá bài học này?")) return;
    try {
      setLoading(true);
      setMsg("");
      await apiDelete(`/api/lesson/${id}`);
      await loadList(1);
      setEditing(null);
    } catch (e) {
      setMsg(e.message || "Lỗi xoá bài học");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Lessons Admin</h1>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded bg-black text-white"
            onClick={newLesson}
          >
            + New
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <input
          className="border rounded px-3 py-2"
          placeholder="Tìm theo từ khoá…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Topic (vd: chord/theory/orientation)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Level (1..4)"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        />
        <button
          className="px-3 py-2 rounded border"
          onClick={() => loadList(1)}
        >
          Lọc
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* List */}
        <div className="rounded-2xl border p-3">
          {items.length === 0 ? (
            <div className="text-gray-500">Chưa có bài học.</div>
          ) : (
            <ul className="divide-y">
              {items.map((it) => (
                <li
                  key={it._id || it.id}
                  className="py-3 flex items-start justify-between"
                >
                  <div>
                    <div className="font-medium">{it.title}</div>
                    <div className="text-xs text-gray-500">
                      topic: {it.topic} • level: {it.level} • tags:{" "}
                      {(it.tags || []).join(", ")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-blue-600"
                      onClick={() => setEditing(it)}
                    >
                      Sửa
                    </button>
                    <button
                      className="text-red-600"
                      onClick={() => deleteLesson(it._id || it.id)}
                    >
                      Xoá
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* pagination */}
          <div className="flex items-center gap-2 mt-3">
            <button
              className="px-3 py-1 rounded border"
              disabled={page <= 1}
              onClick={() => loadList(page - 1)}
            >
              ← Trước
            </button>
            <div className="text-sm text-gray-600">
              Trang {page} • Tổng {total}
            </div>
            <button
              className="px-3 py-1 rounded border"
              disabled={!hasNext}
              onClick={() => loadList(page + 1)}
            >
              Sau →
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="rounded-2xl border p-3">
          <div className="text-lg font-semibold mb-2">Editor</div>
          {!editing ? (
            <div className="text-gray-500">Chọn bài để sửa hoặc bấm “New”.</div>
          ) : (
            <div className="space-y-4">
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Title"
                value={editing.title || ""}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Slug (để trống sẽ tự tạo theo Title)"
                value={editing.slug || ""}
                onChange={(e) =>
                  setEditing({ ...editing, slug: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Topic (vd: orientation)"
                  value={editing.topic || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, topic: e.target.value })
                  }
                />
                <input
                  className="border rounded px-3 py-2"
                  type="number"
                  min={1}
                  max={4}
                  placeholder="Level 1..4"
                  value={editing.level ?? 1}
                  onChange={(e) =>
                    setEditing({ ...editing, level: Number(e.target.value) })
                  }
                />
              </div>

              <TagsInput
                value={editing.tags || []}
                onChange={(tags) => setEditing({ ...editing, tags })}
              />

              <textarea
                className="w-full border rounded px-3 py-2"
                placeholder="Summary"
                rows={2}
                value={editing.summary || ""}
                onChange={(e) =>
                  setEditing({ ...editing, summary: e.target.value })
                }
              />

              {/* BLOCK EDITOR REPLACING JSON */}
              <div>
                <div className="font-medium mb-1">Blocks</div>
                <BlockEditor
                  value={editing.blocks || []}
                  onChange={(blocks) => setEditing({ ...editing, blocks })}
                />
              </div>

              {/* Keep resources/exercises as JSON for now — can upgrade later similarly */}
              <details>
                <summary className="font-medium cursor-pointer">
                  Resources & Exercises (tạm thời JSON)
                </summary>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <textarea
                    className="w-full border rounded px-3 py-2 font-mono text-sm"
                    rows={6}
                    value={JSON.stringify(editing.resources || [], null, 2)}
                    onChange={(e) => {
                      try {
                        setEditing({
                          ...editing,
                          resources: JSON.parse(e.target.value || "[]"),
                        });
                      } catch {}
                    }}
                  />
                  <textarea
                    className="w-full border rounded px-3 py-2 font-mono text-sm"
                    rows={6}
                    value={JSON.stringify(editing.exercises || [], null, 2)}
                    onChange={(e) => {
                      try {
                        setEditing({
                          ...editing,
                          exercises: JSON.parse(e.target.value || "[]"),
                        });
                      } catch {}
                    }}
                  />
                </div>
              </details>

              <div className="grid grid-cols-2 gap-3">
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Cover image URL"
                  value={editing.coverImage || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, coverImage: e.target.value })
                  }
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Video URLs (ngăn cách bằng dấu phẩy)"
                  value={(editing.videoUrls || []).join(", ")}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      videoUrls: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>

              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded bg-black text-white"
                  onClick={saveLesson}
                  disabled={loading}
                >
                  Lưu
                </button>
                {editing._id || editing.id ? (
                  <button
                    className="px-4 py-2 rounded border"
                    onClick={() => setEditing(null)}
                    disabled={loading}
                  >
                    Huỷ
                  </button>
                ) : null}
              </div>

              {msg && <div className="text-sm text-gray-600">{msg}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
