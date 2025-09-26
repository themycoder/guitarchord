import React, { useState, useEffect, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDarkMode } from "../../context/DarkModeContext";
import axios from "axios";
import { debounce } from "lodash";

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
// Tính tên hiển thị từ payload JWT (đủ mọi trường hợp)
function getDisplayNameFromPayload(p) {
  if (!p) return "";
  if (p.displayName) return p.displayName;
  if (p.username) return p.username;
  const full = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (p.email) return String(p.email).split("@")[0];
  return "";
}

const Navbar = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [userInfo, setUserInfo] = useState(null); // payload JWT
  const navigate = useNavigate();
  const location = useLocation();

  const baseLink = "transition-colors duration-200 font-medium";
  const hoverClass = darkMode ? "hover:text-blue-400" : "hover:text-orange-500";

  // API base URL
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Axios instance + attach Authorization
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

  // Cập nhật userInfo khi:
  // - mount lần đầu
  // - URL thay đổi (sau khi Google redirect về / hoặc /login)
  // - localStorage thay đổi (trường hợp token set từ chỗ khác)
  useEffect(() => {
    const updateFromStorage = () => {
      const { accessToken } = loadTokens();
      setUserInfo(accessToken ? decodeJwtPayload(accessToken) : null);
    };
    updateFromStorage();

    // nghe thay đổi localStorage (token được set/sửa từ nơi khác)
    const onStorage = (e) => {
      if (e.key === TOKENS_KEY) updateFromStorage();
    };
    window.addEventListener("storage", onStorage);

    // khi route/URL change (Google redirect) thì đọc lại token
    // location.key thay đổi khi react-router điều hướng
    // dependency ở dưới sẽ chạy updateFromStorage()
    return () => window.removeEventListener("storage", onStorage);
  }, [location.key]);

  // Debounced search
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
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search-results?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setShowResults(false);
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

  const { accessToken } = loadTokens();
  const isAuthed = Boolean(accessToken);
  const nameToShow = getDisplayNameFromPayload(userInfo);

  return (
    <nav
      className={`w-full flex items-center justify-between px-6 py-3 shadow-md ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      } transition-colors duration-300 fixed top-0 left-0 right-0 z-50`}
    >
      {/* Left Section */}
      <div className="flex space-x-4">
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

      {/* Center Section */}
      <div className="flex space-x-6">
        <NavLink to="/chord-library" className={`${baseLink} ${hoverClass}`}>
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
          Theory
        </NavLink>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        <button className="text-sm border px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
          EN | VN
        </button>

        <button
          onClick={toggleDarkMode}
          className="text-sm border px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>

        {!isAuthed ? (
          <NavLink to="/login" className={`${baseLink} ${hoverClass}`}>
            Đăng nhập
          </NavLink>
        ) : (
          <div className="flex items-center gap-2">
            {nameToShow && (
              <span className="text-sm opacity-80 hidden sm:inline">
                {nameToShow}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm border px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Đăng xuất"
            >
              Đăng xuất
            </button>
          </div>
        )}

        <div className="relative">
          {/* <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="px-3 py-1.5 border rounded-lg bg-white text-black dark:bg-gray-800 dark:text-white placeholder:text-sm placeholder-gray-500 dark:placeholder-gray-400 w-52 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
              placeholder="Tìm kiếm hợp âm..."
            />
          </form> */}

          {/* Search results dropdown */}
          {showResults && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border dark:border-gray-700 max-h-80 overflow-y-auto">
              {isSearching ? (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-pulse">Đang tìm kiếm...</div>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((chord) => (
                  <div
                    key={chord._id}
                    className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                    onClick={() => handleResultClick(chord)}
                  >
                    <div className="font-medium text-lg dark:text-white">
                      {chord.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {chord.notes.join(", ")}
                    </div>
                    {chord.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {chord.description}
                      </div>
                    )}
                  </div>
                ))
              ) : searchQuery ? (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                  Không tìm thấy kết quả cho "{searchQuery}"
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
