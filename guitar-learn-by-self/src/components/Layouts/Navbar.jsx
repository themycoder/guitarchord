// src/components/layout/Navbar.jsx
import React, { useState, useEffect, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDarkMode } from "../../context/DarkModeContext";
import axios from "axios";
import { debounce } from "lodash";
import { FaGuitar } from "react-icons/fa";

const TOKENS_KEY = "auth_tokens_v1"; // { accessToken, refreshToken }

function loadTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY) || "{}");
  } catch {
    return {};
  }
}
function clearTokens() {
  localStorage.removeItem(TOKENS_KEY);
}
function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
// Lấy tên hiển thị từ payload JWT
function getDisplayNameFromPayload(p) {
  if (!p) return "";
  if (p.displayName) return p.displayName;
  if (p.username) return p.username;
  const full = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (p.email) return String(p.email).split("@")[0];
  return "";
}

// avatar fallback từ tên
const fallbackAvatar = (name = "User") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=random`;

/* -----------------------
   Dropdown tên tài khoản
------------------------*/
const UserMenu = ({
  nameToShow,
  avatarUrl,
  baseLink,
  hoverClass,
  onLogout,
}) => {
  const [open, setOpen] = React.useState(false);
  const closeTimer = React.useRef(null);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const openMenu = () => {
    clearCloseTimer();
    setOpen(true);
  };
  const closeMenu = (delay = 200) => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), delay);
  };
  const toggleMenu = () => setOpen((v) => !v);
  const onKeyDown = (e) => {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleMenu();
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={() => closeMenu()}
      onPointerEnter={openMenu}
      onPointerLeave={() => closeMenu()}
    >
      {/* Nút có avatar + tên */}
      <button
        type="button"
        className="flex items-center gap-2 text-sm rounded-full px-3 py-1.5
             border border-transparent bg-white/70 backdrop-blur
             hover:bg-[#D0E3FF]/70 dark:bg-white/10 dark:hover:bg-white/20
             transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleMenu}
        onKeyDown={onKeyDown}
        title={nameToShow}
      >
        <img
          src={avatarUrl}
          alt="avatar"
          className="w-8 h-8 rounded-full object-cover border border-white/60 dark:border-white/20"
          referrerPolicy="no-referrer"
        />
        {/* HIỂN THỊ FULL TÊN, KHÔNG CẮT */}
        <span className="text-slate-800 dark:text-slate-50 whitespace-nowrap">
          {nameToShow || "Tài khoản"}
        </span>
      </button>

      <div
        className={`absolute right-0 mt-2 w-52 rounded-2xl shadow-xl border
                    border-[#D0E3FF] dark:border-white/10
                    bg-white/95 dark:bg-[#061F5C]/95 backdrop-blur
                    ${open ? "block" : "hidden"} z-50`}
        role="menu"
        tabIndex={-1}
        onMouseEnter={openMenu}
        onMouseLeave={() => closeMenu()}
        onPointerEnter={openMenu}
        onPointerLeave={() => closeMenu()}
      >
        <NavLink
          to="/profile"
          className={`block px-4 py-2.5 ${baseLink} ${hoverClass}`}
          role="menuitem"
          onClick={() => setOpen(false)}
        >
          Profile
        </NavLink>
        <NavLink
          to="/"
          className={`block px-4 py-2.5 ${baseLink} ${hoverClass}`}
          role="menuitem"
          onClick={() => setOpen(false)}
        >
          Trở vào (Dashboard)
        </NavLink>
        <button
          className="w-full text-left block px-4 py-2.5 text-sm font-semibold
                     text-red-600 hover:bg-[#F9FCFF] dark:hover:bg-white/10
                     rounded-b-2xl"
          role="menuitem"
          onClick={() => {
            setOpen(false);
            onLogout();
          }}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

const Navbar = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [userInfo, setUserInfo] = useState(null); // payload JWT
  const [mobileOpen, setMobileOpen] = useState(false); // menu thu gọn

  // NEW: tên & avatar hiển thị
  const [nameToShow, setNameToShow] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // palette cho link
  const baseLink =
    "relative text-sm font-medium transition-all duration-200 rounded-full";
  const hoverClass = darkMode
    ? "text-slate-100 hover:text-white hover:bg-white/10 px-3 py-1.5"
    : "text-slate-700 hover:text-[#061F5C] hover:bg-[#D0E3FF]/80 px-3 py-1.5";

  // API base URL
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Axios + attach Authorization
  const ax = useMemo(() => {
    const instance = axios.create({ baseURL: API_BASE_URL });
    instance.interceptors.request.use((config) => {
      const { accessToken } = loadTokens();
      if (accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });
    return instance;
  }, [API_BASE_URL]);

  // cập nhật userInfo theo token
  useEffect(() => {
    const updateFromStorage = () => {
      const { accessToken } = loadTokens();
      setUserInfo(accessToken ? decodeJwtPayload(accessToken) : null);
    };
    updateFromStorage();
    const onStorage = (e) => {
      if (e.key === TOKENS_KEY) updateFromStorage();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [location.key]);

  // Debounced search (hiện chưa render ô search nhưng giữ logic nếu sau này dùng)
  const searchChords = debounce(async (query) => {
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await ax.get(`/api/chords/search`, {
        params: { q: query, limit: 5 },
      });
      if (response.data?.success && Array.isArray(response.data.data?.chords)) {
        setSearchResults(response.data.data.chords);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  useEffect(() => {
    if (searchQuery) {
      searchChords(searchQuery);
    } else {
      setSearchResults([]);
    }
    return () => searchChords.cancel();
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowResults(true);
  };

  const handleResultClick = (chord) => {
    navigate(`/chord/${encodeURIComponent(chord.name)}`);
    setSearchQuery("");
    setShowResults(false);
    setMobileOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search-results?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setShowResults(false);
      setMobileOpen(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      const { accessToken, refreshToken } = loadTokens();
      if (!refreshToken) {
        clearTokens();
        setUserInfo(null);
        navigate("/login");
        return;
      }
      await ax.post(
        `/api/auth/logout`,
        { refreshToken },
        { headers: { Authorization: `Bearer ${accessToken || ""}` } }
      );
      clearTokens();
      setUserInfo(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err?.response?.data || err?.message);
      clearTokens();
      setUserInfo(null);
      navigate("/login");
    }
  };

  // ---- NEW: tính isAuthed + set tạm tên/ava từ JWT, sau đó fetch profile để lấy avatarUrl thật
  const { accessToken } = loadTokens();
  const isAuthed = Boolean(accessToken);

  useEffect(() => {
    const tempName = getDisplayNameFromPayload(
      accessToken ? decodeJwtPayload(accessToken) : null
    );
    const initialName = tempName || "Tài khoản";
    setNameToShow(initialName);
    setAvatarUrl(fallbackAvatar(tempName || "User"));

    if (!isAuthed) {
      // chưa đăng nhập
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await ax.get("/api/profile/me");
        if (cancelled) return;
        const u = res?.data?.user || {};
        const name =
          u.displayName ||
          u.username ||
          tempName ||
          (u.email || "").split("@")[0] ||
          "User";
        const ava =
          u.avatarUrl && u.avatarUrl.trim()
            ? u.avatarUrl
            : fallbackAvatar(name);
        setNameToShow(name);
        setAvatarUrl(ava);
      } catch (e) {
        // giữ fallback nếu lỗi
        console.error(
          "Fetch /api/profile/me error:",
          e?.response?.data || e?.message
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthed, ax]);

  const navBg = darkMode
    ? "bg-gradient-to-r from-[#061F5C] via-[#334EAC] to-[#7096D1]"
    : "bg-gradient-to-r from-[#D0E3FF] via-[#E7F1FF] to-[#F9FCFF]";

  return (
    <>
      <nav
        className={`w-full fixed top-0 left-0 right-0 z-50 ${navBg}
                    shadow-md transition-colors duration-300`}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-3 flex items-center justify-between gap-6">
          {/* Left: logo + hamburger (chỉ hiện trên mobile) */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden inline-flex items-center justify-center rounded-full
                         border border-white/40 bg-white/20 backdrop-blur
                         px-2.5 py-1.5 text-slate-800 dark:text-slate-50"
              aria-label="Mở menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {/* icon hamburger/close đơn giản */}
              <span className="block w-5 h-[2px] bg-current relative">
                <span
                  className={`absolute top-[-6px] left-0 w-5 h-[2px] bg-current transition-transform ${
                    mobileOpen ? "rotate-45 translate-y-[6px]" : ""
                  }`}
                />
                <span
                  className={`absolute top-[6px] left-0 w-5 h-[2px] bg-current transition-transform ${
                    mobileOpen ? "-rotate-45 -translate-y-[6px]" : ""
                  }`}
                />
              </span>
            </button>

            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-2xl
                              bg-[#061F5C] text-[#D0E3FF] shadow-md"
              >
                <FaGuitar className="text-lg" />
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-[#061F5C] dark:text-[#F9FCFF]">
                guitarhiho
              </h2>
            </div>
          </div>

          {/* Nhóm link trái (ẩn trên mobile) */}
          <div className="hidden md:flex space-x-2">
            <NavLink to="/about" className={`${baseLink} ${hoverClass}`}>
              About
            </NavLink>
            <NavLink to="/contact" className={`${baseLink} ${hoverClass}`}>
              Contact
            </NavLink>
            <NavLink to="/faq" className={`${baseLink} ${hoverClass}`}>
              FAQ
            </NavLink>
          </div>

          {/* Nhóm link giữa + actions (ẩn trên mobile) */}
          <div className="hidden md:flex items-center space-x-3">
            <NavLink
              to="/chord-library"
              className={`${baseLink} ${hoverClass}`}
            >
              Chord Library
            </NavLink>
            <NavLink to="/analyze" className={`${baseLink} ${hoverClass}`}>
              Analyzer
            </NavLink>
            <NavLink to="/scales" className={`${baseLink} ${hoverClass}`}>
              Scales
            </NavLink>
            <NavLink to="/progressions" className={`${baseLink} ${hoverClass}`}>
              Progressions
            </NavLink>
            <NavLink to="/theory" className={`${baseLink} ${hoverClass}`}>
              Lesson
            </NavLink>
            <NavLink to="/quiz" className={`${baseLink} ${hoverClass}`}>
              Quiz
            </NavLink>
            <NavLink to="/information" className={`${baseLink} ${hoverClass}`}>
              Information
            </NavLink>

            <button
              onClick={toggleDarkMode}
              className="ml-2 inline-flex items-center gap-1 text-xs font-medium
                         rounded-full px-3 py-1.5 border border-white/50
                         bg-white/10 backdrop-blur
                         text-slate-800 dark:text-slate-50
                         hover:bg-white/30 dark:hover:bg-white/20
                         transition-colors"
            >
              {darkMode ? "☀️ Light mode" : "🌙 Dark mode"}
            </button>

            {!isAuthed ? (
              <NavLink to="/login" className={`${baseLink} ${hoverClass} ml-1`}>
                Đăng nhập
              </NavLink>
            ) : (
              <UserMenu
                nameToShow={nameToShow}
                avatarUrl={avatarUrl}
                baseLink={baseLink}
                hoverClass={hoverClass}
                onLogout={handleLogout}
              />
            )}
          </div>
        </div>
      </nav>

      {/* Panel thu gọn (mobile) — nhỏ gọn, không thay layout desktop */}
      <div
        className={`md:hidden fixed top-[58px] left-0 right-0 origin-top ${
          mobileOpen
            ? "scale-y-100 opacity-100"
            : "scale-y-0 opacity-0 pointer-events-none"
        } transition-transform duration-200 ease-out`}
      >
        <div
          className={`${
            darkMode
              ? "bg-[#061F5C]/95 text-white"
              : "bg-white/95 text-slate-900"
          } border-t border-[#D0E3FF] dark:border-white/10 shadow-xl backdrop-blur`}
        >
          <div className="px-4 py-3 flex flex-col gap-2">
            {/* Avatar + tên trên mobile (nếu đã đăng nhập) */}
            {isAuthed && (
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-9 h-9 rounded-full object-cover border border-white/60 dark:border-white/20"
                  referrerPolicy="no-referrer"
                />
                <div className="font-semibold truncate">
                  {nameToShow || "Tài khoản"}
                </div>
              </div>
            )}

            <NavLink
              to="/about"
              className={`${baseLink} ${hoverClass}`}
              onClick={() => setMobileOpen(false)}
            >
              About
            </NavLink>
            <NavLink
              to="/contact"
              className={`${baseLink} ${hoverClass}`}
              onClick={() => setMobileOpen(false)}
            >
              Contact
            </NavLink>
            <NavLink
              to="/faq"
              className={`${baseLink} ${hoverClass}`}
              onClick={() => setMobileOpen(false)}
            >
              FAQ
            </NavLink>

            <div className="my-2 border-t border-[#D0E3FF]/80 dark:border-white/10" />

            <NavLink
              to="/chord-library"
              className={`${baseLink} ${hoverClass}`}
              onClick={() => setMobileOpen(false)}
            >
              Chord Library
            </NavLink>
            <NavLink
              to="/analyze"
              className={`${baseLink} ${hoverClass}`}
              onClick={() => setMobileOpen(false)}
            >
              Analyzer
            </NavLink>
            <NavLink
              to="/scales"
              className={`${baseLink} ${hoverClass}`}
              onClick={() => setMobileOpen(false)}
            >
              Scales
            </NavLink>
            <NavLink
              to="/progressions"
              className={`${baseLink} ${hoverClass}`}
              onClick={() => setMobileOpen(false)}
            >
              Progressions
            </NavLink>
            <NavLink
              to="/theory"
              className={`${baseLink} ${hoverClass}`}
              onClick={() => setMobileOpen(false)}
            >
              Theory
            </NavLink>
            <NavLink
              to="/quiz"
              className={`${baseLink} ${hoverClass}`}
              onClick={() => setMobileOpen(false)}
            >
              Quiz
            </NavLink>
            <NavLink
              to="/information"
              className={`${baseLink} ${hoverClass}`}
              onClick={() => setMobileOpen(false)}
            >
              Information
            </NavLink>

            <div className="my-2 border-t border-[#D0E3FF]/80 dark:border-white/10" />

            <button
              onClick={() => {
                toggleDarkMode();
              }}
              className="inline-flex items-center gap-1 text-xs font-medium
                         rounded-full px-3 py-1.5 border border-[#D0E3FF]
                         bg-[#F9FCFF] text-[#061F5C]
                         dark:border-white/40 dark:bg-white/10 dark:text-white
                         self-start hover:bg-[#D0E3FF]/80 dark:hover:bg:white/20
                         transition-colors"
            >
              {darkMode ? "☀️ Light mode" : "🌙 Dark mode"}
            </button>

            {!isAuthed ? (
              <NavLink
                to="/login"
                className={`${baseLink} ${hoverClass}`}
                onClick={() => setMobileOpen(false)}
              >
                Đăng nhập
              </NavLink>
            ) : (
              <>
                <NavLink
                  to="/profile"
                  className={`${baseLink} ${hoverClass}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Profile
                </NavLink>
                <NavLink
                  to="/"
                  className={`${baseLink} ${hoverClass}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Trở vào (Dashboard)
                </NavLink>
                <button
                  className="text-left text-red-500 font-semibold mt-1"
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                >
                  Đăng xuất
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
