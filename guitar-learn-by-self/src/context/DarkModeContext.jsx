// src/context/DarkModeContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

// 1. Tạo context
const DarkModeContext = createContext();

// 2. Custom hook cho tiện dùng
export const useDarkMode = () => useContext(DarkModeContext);

// 3. Provider
export const DarkModeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Đọc dark mode từ localStorage khi load lần đầu
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    // Gắn class cho body để dùng Tailwind (nếu có)
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};
