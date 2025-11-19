import { useEffect, useRef, useState } from "react";

/** Simple chips input (Enter hoặc dấu phẩy để thêm). Controlled: value/onChange */
export default function ChipInput({
  id,
  label,
  placeholder,
  value = [],
  onChange,
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  // Chuẩn hoá 1 lần
  useEffect(() => {
    const unique = [
      ...new Set((value || []).map((s) => String(s).trim()).filter(Boolean)),
    ];
    if (unique.length !== (value || []).length) onChange(unique);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addChip(v) {
    const t = String(v || "").trim();
    if (!t) return;
    const next = [...(value || [])];
    if (!next.includes(t)) next.push(t);
    onChange(next);
    setDraft("");
  }

  function onKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addChip(draft);
    }
  }

  function onChangeInput(e) {
    const raw = e.target.value;
    if (raw.includes(",")) {
      const parts = raw.split(",");
      parts.slice(0, -1).forEach(addChip);
      setDraft(parts[parts.length - 1]);
    } else {
      setDraft(raw);
    }
  }

  function removeChip(ch) {
    onChange((value || []).filter((x) => x !== ch));
  }

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-800">
          {label}
        </label>
      )}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border px-2 py-2 focus-within:ring-2">
        {(value || []).map((ch) => (
          <span
            key={ch}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm"
          >
            {ch}
            <button
              type="button"
              aria-label={`Remove ${ch}`}
              onClick={() => removeChip(ch)}
              className="ml-1 text-gray-500 hover:text-gray-800"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          ref={inputRef}
          className="min-w-[160px] flex-1 p-1 outline-none"
          placeholder={placeholder || "Nhập và nhấn Enter / ,"}
          value={draft}
          onChange={onChangeInput}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}
