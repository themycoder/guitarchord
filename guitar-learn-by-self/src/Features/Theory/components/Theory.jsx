import React, { useMemo, useEffect, useState, useRef } from "react";
import { useDarkMode } from "../../../context/DarkModeContext";

/**
 * Guitar Theory Tutorial Page – Revamped UI (v2, dark-mode ready)
 * - ToC hẹp hơn + có viền/bối cảnh riêng
 * - Content rộng hơn
 * - Nút điều hướng Bài trước / Bài tiếp
 * - Dark mode: toggle qua Context -> thêm class 'dark' vào <html>
 */

const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_API_BASE) ||
  "http://localhost:3000/api";

/* Utils */
const cx = (...args) => args.filter(Boolean).join(" ");
function slugify(s = "") {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 80);
}

/* Chord Diagram (dark-mode aware via currentColor) */
function ChordDiagram({ name, strings, fingers = [], startFret = 1 }) {
  const frets = 5;
  const stringCount = strings.length || 6;
  const width = 160;
  const height = 220;
  const padding = 18;
  const gridW = width - padding * 2;
  const gridH = height - padding * 2;
  const stringGap = gridW / (stringCount - 1);
  const fretGap = gridH / frets;
  const showNut = startFret === 1;

  return (
    <div
      className="inline-block text-center select-none text-slate-800 dark:text-slate-200"
      style={{ width }}
    >
      {name && (
        <div className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
          {name}
        </div>
      )}
      <svg width={width} height={height}>
        {/* Strings */}
        {Array.from({ length: stringCount }).map((_, i) => {
          const x = padding + i * stringGap;
          return (
            <line
              key={`s-${i}`}
              x1={x}
              y1={padding}
              x2={x}
              y2={padding + gridH}
              stroke="currentColor"
              strokeWidth={1}
              opacity={0.9}
            />
          );
        })}
        {/* Frets */}
        {Array.from({ length: frets + 1 }).map((_, i) => {
          const y = padding + i * fretGap;
          return (
            <line
              key={`f-${i}`}
              x1={padding}
              y1={y}
              x2={padding + gridW}
              y2={y}
              stroke="currentColor"
              strokeWidth={showNut && i === 0 ? 4 : 1}
              strokeLinecap="round"
              opacity={showNut && i === 0 ? 1 : 0.7}
            />
          );
        })}
        {/* X / O */}
        {strings.map((v, i) => {
          const x = padding + i * stringGap;
          if (v === "x" || v === 0) {
            return (
              <text
                key={`m-${v}-${i}`}
                x={x}
                y={padding - 6}
                textAnchor="middle"
                fontSize="10"
                className="fill-slate-700 dark:fill-slate-300"
              >
                {v === "x" ? "x" : "o"}
              </text>
            );
          }
          return null;
        })}
        {/* Dots */}
        {strings.map((v, i) => {
          if (typeof v !== "number" || v <= 0) return null;
          const stringX = padding + i * stringGap;
          const fretIndex = v - startFret + 1;
          if (fretIndex < 0 || fretIndex > frets) return null;
          const y = padding + fretIndex * fretGap - fretGap / 2;
          return (
            <g key={`dot-${i}`}>
              <circle
                cx={stringX}
                cy={y}
                r={7}
                className="fill-slate-900 dark:fill-slate-200"
              />
              {fingers[i] ? (
                <text
                  x={stringX}
                  y={y + 3}
                  textAnchor="middle"
                  fontSize="10"
                  className="fill-white dark:fill-slate-900"
                >
                  {fingers[i]}
                </text>
              ) : null}
            </g>
          );
        })}
        {!showNut && (
          <text
            x={padding + gridW + 6}
            y={padding + fretGap}
            fontSize="10"
            className="fill-slate-500 dark:fill-slate-400"
            textAnchor="start"
            alignmentBaseline="middle"
          >
            {startFret}
          </text>
        )}
      </svg>
    </div>
  );
}

/* Blocks */
function Heading({ level = 2, text, id }) {
  const Tag = `h${Math.min(Math.max(level, 1), 4)}`;
  const base = "scroll-mt-28 group/hd flex items-center gap-2";
  const sizes = {
    h1: "text-4xl md:text-5xl font-extrabold tracking-tight",
    h2: "text-2xl md:text-3xl font-bold",
    h3: "text-xl md:text-2xl font-semibold",
    h4: "text-lg md:text-xl font-semibold",
  };

  return (
    <Tag
      id={id}
      className={`${base} ${sizes[Tag]} text-slate-900 dark:text-slate-100`}
    >
      <span className="inline-block rounded-lg bg-gradient-to-r from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-900/20 px-2 py-1 text-indigo-700 dark:text-indigo-300 ring-1 ring-inset ring-indigo-200 dark:ring-indigo-800">
        §
      </span>

      <span className="leading-tight">{text}</span>

      {/* Dấu # */}
      <a
        href={`#${id}`}
        className="relative z-10 ml-1 inline-flex items-center text-indigo-500 hover:text-indigo-600 dark:text-indigo-300 dark:hover:text-indigo-200 md:opacity-0 md:group-hover/hd:opacity-100 transition"
        aria-label={`Liên kết đến mục: ${text}`}
        onClick={(e) => {
          e.preventDefault();
          const target = document.getElementById(id);
          if (target)
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          if (typeof window !== "undefined") {
            if (history.replaceState) history.replaceState(null, "", `#${id}`);
            else window.location.hash = id;
          }
        }}
      >
        #
      </a>
    </Tag>
  );
}

function Paragraph({ text, align = "start" }) {
  return (
    <p
      className={cx(
        "leading-7 text-slate-800 dark:text-slate-200",
        align === "center" && "text-center"
      )}
    >
      {text}
    </p>
  );
}
function ListBlock({ items = [], ordered = false }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag
      className={cx(
        "my-4 list-inside space-y-1 marker:text-slate-400 dark:marker:text-slate-500 text-slate-800 dark:text-slate-200",
        ordered ? "list-decimal" : "list-disc"
      )}
    >
      {items.map((it, idx) => (
        <li key={idx}>{typeof it === "string" ? it : it.text}</li>
      ))}
    </Tag>
  );
}
function ImageBlock({ src, alt, caption, width = "100%" }) {
  return (
    <figure className="my-6">
      <img
        src={src}
        alt={alt}
        style={{ width }}
        className="rounded-xl shadow-sm ring-1 ring-black/5 dark:ring-white/10"
      />
      {caption && (
        <figcaption className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
function CodeBlock({ code, language = "" }) {
  return (
    <pre className="my-4 p-4 bg-slate-900 text-slate-50 rounded-xl overflow-x-auto text-sm ring-1 ring-black/10 dark:ring-white/10">
      <code className={`language-${language}`}>{code}</code>
    </pre>
  );
}
function Callout({ title, text, tone = "info" }) {
  const tones = {
    info: "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800",
    success:
      "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800",
    warning:
      "bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800",
    danger:
      "bg-rose-50 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800",
  };
  const textTone = {
    info: "text-indigo-800 dark:text-indigo-200",
    success: "text-emerald-800 dark:text-emerald-200",
    warning: "text-amber-800 dark:text-amber-200",
    danger: "text-rose-800 dark:text-rose-200",
  };
  return (
    <div className={cx("my-4 border rounded-2xl p-4", tones[tone])}>
      {title && (
        <div className={cx("font-semibold mb-1", textTone[tone])}>{title}</div>
      )}
      <div className="text-slate-800 dark:text-slate-200">{text}</div>
    </div>
  );
}
function Quote({ text, cite }) {
  return (
    <blockquote className="my-6 border-l-4 pl-4 italic text-slate-700 dark:text-slate-200 dark:border-slate-600">
      {text}
      {cite && (
        <div className="not-italic text-sm text-slate-500 dark:text-slate-400 mt-2">
          — {cite}
        </div>
      )}
    </blockquote>
  );
}
function Divider() {
  return <hr className="my-8 border-slate-200 dark:border-slate-700/60" />;
}
function Columns({ columns = [], gap = "gap-6" }) {
  return (
    <div className={cx("grid md:grid-cols-2", gap)}>
      {columns.map((col, i) => (
        <div key={i} className="space-y-4">
          {col.map((blk, j) => (
            <Block key={`${i}-${j}`} {...blk} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* Right article list */
function ArticleList({ articles = [], onPick }) {
  return (
    <div className="sticky top-28 space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Bài theory khác
      </div>
      <div className="space-y-3">
        {articles.map((a) => (
          <a
            key={a._id || a.id || a.slug}
            href={`/theory/${a.slug}`}
            onClick={(e) => {
              e.preventDefault();
              onPick && onPick(a.slug);
              if (typeof window !== "undefined") {
                window.history.pushState({}, "", `/theory/${a.slug}`);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="block group"
          >
            <div className="flex gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/70 backdrop-blur hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow transition">
              {a.cover ? (
                <img
                  src={a.cover}
                  alt="cover"
                  className="w-16 h-16 rounded-lg object-cover ring-1 ring-inset ring-slate-200 dark:ring-slate-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-500 ring-1 ring-inset ring-slate-200 dark:ring-slate-700">
                  ♪
                </div>
              )}
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 dark:text-slate-100 leading-tight group-hover:underline line-clamp-2">
                  {a.title}
                </div>
                {a.excerpt && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {a.excerpt}
                  </div>
                )}
                {!!(a.tags && a.tags.length) && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {a.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-700"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/* Block registry */
const BLOCK_RENDERERS = {
  heading: Heading,
  paragraph: Paragraph,
  list: ListBlock,
  image: ImageBlock,
  chord: ChordDiagram,
  code: CodeBlock,
  callout: Callout,
  quote: Quote,
  divider: Divider,
  columns: Columns,
};
function Block({ type, props }) {
  const Comp = BLOCK_RENDERERS[type];
  if (!Comp) return null;
  return <Comp {...(props || {})} />;
}

/* Build ToC & Sections */
function useTocAndSections(blocks) {
  return useMemo(() => {
    const toc = [];
    const cloned = blocks.map((b) => ({ ...b, props: { ...(b.props || {}) } }));

    cloned.forEach((b) => {
      if (b.type === "heading") {
        const lvl = b.props?.level ?? 2;
        if (lvl === 2 || lvl === 3) {
          const id = b.props?.id || slugify(b.props?.text || "");
          toc.push({ level: lvl, text: b.props?.text, id });
          b.props.id = id;
        }
      }
      if (b.type === "columns") {
        for (const col of b.props?.columns || []) {
          for (const nb of col) {
            if (nb.type === "heading") {
              const lvl = nb.props?.level ?? 2;
              if (lvl === 2 || lvl === 3) {
                const id = nb.props?.id || slugify(nb.props?.text || "");
                toc.push({ level: lvl, text: nb.props?.text, id });
                nb.props.id = id;
              }
            }
          }
        }
      }
    });

    const sections = [];
    let current = null;
    const pushCurrent = () => {
      if (current) sections.push(current);
      current = null;
    };

    cloned.forEach((b) => {
      if (b.type === "heading" && (b.props?.level ?? 2) === 2) {
        pushCurrent();
        current = { id: b.props.id, title: b.props.text, blocks: [b] };
      } else {
        if (!current)
          current = { id: "intro", title: "Giới thiệu", blocks: [] };
        current.blocks.push(b);
      }
    });
    pushCurrent();

    return { toc, sections };
  }, [blocks]);
}

/* Scroll-spy & progress */
function useScrollSpy(ids = []) {
  const [active, setActive] = useState(ids[0] || null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!ids.length) return;
    const options = {
      root: null,
      rootMargin: "0px 0px -60% 0px",
      threshold: 0.01,
    };
    const cb = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    };
    const obs = new IntersectionObserver(cb, options);
    observerRef.current = obs;

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [ids.join("|")]);

  return active;
}
function useReadProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      const y = el.scrollTop;
      const pct = total > 0 ? Math.min(100, Math.max(0, (y / total) * 100)) : 0;
      setProgress(pct);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

/* Helper: Prev / Next */
function usePrevNext(articles, currentSlug) {
  return useMemo(() => {
    if (!articles?.length || !currentSlug)
      return { prevSlug: null, nextSlug: null };
    const idx = articles.findIndex(
      (a) =>
        a.slug === currentSlug || a._id === currentSlug || a.id === currentSlug
    );
    if (idx === -1) return { prevSlug: null, nextSlug: null };
    const prevSlug = articles[idx - 1]?.slug || null;
    const nextSlug = articles[idx + 1]?.slug || null;
    return { prevSlug, nextSlug };
  }, [articles, currentSlug]);
}

/* Page */
export default function TheoryPage({ idOrSlug, blocks = [], showList = true }) {
  const { darkMode } = useDarkMode?.() || { darkMode: false };

  // Toggle class 'dark' trên <html> để Tailwind áp dụng dark:*
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [darkMode]);

  const [article, setArticle] = useState(null);
  const [displayBlocks, setDisplayBlocks] = useState(blocks);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSlug, setActiveSlug] = useState(idOrSlug || null);

  useEffect(() => {
    setActiveSlug(idOrSlug || null);
  }, [idOrSlug]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        if (activeSlug) {
          const res = await fetch(
            `${API_BASE}/theory/${encodeURIComponent(activeSlug)}`
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (cancelled) return;
          setArticle(json.data);
          setDisplayBlocks(json.data?.blocks || []);
        } else {
          const res = await fetch(
            `${API_BASE}/theory?status=published&limit=1&sort=newest`
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          const first = Array.isArray(json.data) ? json.data[0] : null;
          if (cancelled) return;
          setArticle(first || null);
          setDisplayBlocks(first?.blocks || []);
          setActiveSlug(first?.slug || null);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [activeSlug]);

  useEffect(() => {
    let cancelled = false;
    async function loadList() {
      try {
        const res = await fetch(
          `${API_BASE}/theory?status=published&limit=20&sort=newest`
        );
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setArticles(json.data || []);
      } catch {}
    }
    if (showList) loadList();
    return () => {
      cancelled = true;
    };
  }, [showList]);

  const { toc, sections } = useTocAndSections(displayBlocks);
  const topLevelIds = toc.filter((t) => t.level === 2).map((t) => t.id);
  const activeId = useScrollSpy(topLevelIds);
  const progress = useReadProgress();

  // Back to top
  const [showUp, setShowUp] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowUp(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Prev / Next
  const currentSlug = article?.slug || activeSlug;
  const { prevSlug, nextSlug } = usePrevNext(articles, currentSlug);
  const goSlug = (slug) => {
    if (!slug) return;
    setActiveSlug(slug);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", `/theory/${slug}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div
      className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] 
      from-indigo-50 via-white to-white
      dark:from-slate-900 dark:via-slate-950 dark:to-black"
    >
      {/* Reading progress */}
      <div className="sticky top-0 z-40 h-1 bg-transparent">
        <div
          className="h-1 bg-indigo-500/90 dark:bg-indigo-400/90 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 dark:bg-slate-900/70 px-2 py-0.5 ring-1 ring-slate-200 dark:ring-slate-700">
              <span>🎸</span> Guitar Theory
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 dark:bg-slate-900/70 px-2 py-0.5 ring-1 ring-slate-200 dark:ring-slate-700">
              Block-driven
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {article?.title || "Guitar Theory"}
          </h1>
          {article?.excerpt && (
            <p className="text-slate-600 dark:text-slate-300 max-w-3xl">
              {article.excerpt}
            </p>
          )}
        </header>

        {/* Layout: ToC | Content | Right list */}
        <div className="grid grid-cols-1 xl:grid-cols-[220px,minmax(0,1fr),320px] gap-8">
          {/* ToC */}
          <aside className="hidden xl:block">
            <div className="sticky top-28">
              <div className="rounded-xl bg-white/85 dark:bg-slate-900/70 backdrop-blur ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm p-3">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Mục lục
                </div>
                <nav className="text-sm space-y-1">
                  {toc.map((it, i) => (
                    <a
                      key={i}
                      href="#"
                      role="button"
                      onClick={(e) => {
                        e.preventDefault();
                        const target = document.getElementById(it.id);
                        if (target)
                          target.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                      }}
                      className={cx(
                        "block rounded-lg px-2 py-1.5 transition",
                        it.level === 3
                          ? "ml-4 text-slate-500 dark:text-slate-400"
                          : "text-slate-600 dark:text-slate-300",
                        activeId === it.id
                          ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-1 ring-inset ring-indigo-200 dark:ring-indigo-500/30"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      )}
                    >
                      {it.text}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="max-w-none">
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-slate-200 dark:bg-slate-700/50 rounded" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-2/3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded" />
                <div className="h-96 bg-slate-100 dark:bg-slate-800/60 rounded" />
              </div>
            ) : sections && sections.length ? (
              <div className="space-y-6">
                {sections.map((sec) => (
                  <section
                    key={sec.id}
                    className="rounded-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur p-6 md:p-8 shadow-sm ring-1 ring-black/5 dark:ring-white/5 hover:ring-indigo-200/80 dark:hover:ring-indigo-500/30 transition"
                  >
                    <div className="h-1 -mt-2 -mx-8 mb-4 rounded-t-2xl bg-gradient-to-r from-indigo-400/40 via-indigo-200/20 to-transparent dark:from-indigo-500/30 dark:via-indigo-400/10 dark:to-transparent" />
                    <article className="prose prose-slate max-w-none dark:prose-invert">
                      {sec.blocks.map((blk, i) => (
                        <Block key={blk.id ?? i} {...blk} />
                      ))}
                    </article>
                  </section>
                ))}

                {/* Prev / Next navigation */}
                <nav className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={!prevSlug}
                    onClick={() => goSlug(prevSlug)}
                    className={cx(
                      "flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 ring-1 transition",
                      prevSlug
                        ? "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 ring-slate-200 dark:ring-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                        : "bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 ring-slate-200 dark:ring-slate-700 cursor-not-allowed"
                    )}
                    aria-label="Bài trước"
                    title={prevSlug ? "Bài trước" : "Không có bài trước"}
                  >
                    ← Bài trước
                  </button>

                  <button
                    type="button"
                    disabled={!nextSlug}
                    onClick={() => goSlug(nextSlug)}
                    className={cx(
                      "flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 ring-1 transition",
                      nextSlug
                        ? "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 ring-slate-200 dark:ring-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                        : "bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 ring-slate-200 dark:ring-slate-700 cursor-not-allowed"
                    )}
                    aria-label="Bài tiếp"
                    title={nextSlug ? "Bài tiếp" : "Không có bài tiếp"}
                  >
                    Bài tiếp →
                  </button>
                </nav>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700">
                Không có nội dung để hiển thị. Hãy tạo bài (status:
                <span className="font-semibold"> published</span>) hoặc truyền
                <code className="font-mono"> idOrSlug</code> cho component.
              </div>
            )}
            {error && (
              <div className="mt-4 text-sm text-rose-600 dark:text-rose-400">
                {String(error)}
              </div>
            )}
          </main>

          {/* Right list */}
          {showList ? (
            <aside className="hidden xl:block">
              <ArticleList
                articles={articles}
                onPick={(slug) => {
                  setActiveSlug(slug);
                  if (typeof window !== "undefined") {
                    window.history.pushState({}, "", `/theory/${slug}`);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              />
            </aside>
          ) : null}
        </div>
      </div>

      {/* Back to top */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={cx(
          "fixed bottom-6 right-6 z-40 rounded-full shadow-md ring-1 ring-black/5 dark:ring-white/10",
          "bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition",
          showUp ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-label="Back to top"
      >
        ↑ Top
      </button>
    </div>
  );
}
